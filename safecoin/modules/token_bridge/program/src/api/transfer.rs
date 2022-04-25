use crate::{
    accounts::{
        AuthoritySigner,
        ConfigAccount,
        CoreBridge,
        CustodyAccount,
        CustodyAccountDerivationData,
        CustodySigner,
        EmitterAccount,
        MintSigner,
        WrappedDerivationData,
        WrappedMetaDerivationData,
        WrappedMint,
        WrappedTokenMeta,
    },
    messages::PayloadTransfer,
    types::*,
    TokenBridgeError,
    TokenBridgeError::{
        InvalidChain,
        InvalidFee,
        WrongAccountOwner,
    },
};
use bridge::{
    accounts::Bridge,
    api::{
        PostMessage,
        PostMessageData,
    },
    types::ConsistencyLevel,
    vaa::SerializePayload,
    CHAIN_ID_SAFECOIN,
};
use primitive_types::U256;
use safecoin_program::{
    msg,
    account_info::AccountInfo,
    instruction::{
        AccountMeta,
        Instruction,
    },
    program::{
        invoke,
        invoke_signed,
    },
    program_error::ProgramError,
    program_option::COption,
    pubkey::Pubkey,
    sysvar::clock::Clock,
};
use solitaire::{
    processors::seeded::{
        invoke_seeded,
        Seeded,
    },
    CreationLamports::Exempt,
    *,
};
use safe_token::{
    error::TokenError::OwnerMismatch,
    state::{
        Account,
        Mint,
    },
};
use std::ops::{
    Deref,
    DerefMut,
};

#[derive(FromAccounts)]
pub struct TransferNative<'b> {
    pub payer: Mut<Signer<AccountInfo<'b>>>,

    pub config: ConfigAccount<'b, { AccountState::Initialized }>,

    pub from: Mut<Data<'b, SplAccount, { AccountState::Initialized }>>,

    pub mint: Mut<Data<'b, SplMint, { AccountState::Initialized }>>,

    pub custody: Mut<CustodyAccount<'b, { AccountState::MaybeInitialized }>>,

    // This could allow someone to race someone else's tx if they do the approval in a separate tx.
    // Therefore the approval must be set in the same tx.
    pub authority_signer: AuthoritySigner<'b>,

    pub custody_signer: CustodySigner<'b>,

    /// CPI Context
    pub bridge: Mut<CoreBridge<'b, { AccountState::Initialized }>>,

    /// Account to store the posted message
    pub message: Signer<Mut<Info<'b>>>,

    /// Emitter of the VAA
    pub emitter: EmitterAccount<'b>,

    /// Tracker for the emitter sequence
    pub sequence: Mut<Info<'b>>,

    /// Account to collect tx fee
    pub fee_collector: Mut<Info<'b>>,

    pub clock: Sysvar<'b, Clock>,
}

impl<'a> From<&TransferNative<'a>> for CustodyAccountDerivationData {
    fn from(accs: &TransferNative<'a>) -> Self {
        CustodyAccountDerivationData {
            mint: *accs.mint.info().key,
        }
    }
}

impl<'b> InstructionContext<'b> for TransferNative<'b> {
}

#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct TransferNativeData {
    pub nonce: u32,
    pub amount: u64,
    pub fee: u64,
    pub target_address: Address,
    pub target_chain: ChainID,
}

pub fn transfer_native(
    ctx: &ExecutionContext,
    accs: &mut TransferNative,
    data: TransferNativeData,
) -> Result<()> {
    msg!("*** DEBUG *** transfer_native 01");

    // Prevent transferring to the same chain.
    if data.target_chain == CHAIN_ID_SAFECOIN {
        return Err(InvalidChain.into());
    }
    msg!("*** DEBUG *** transfer_native 02");

    // Verify that the custody account is derived correctly
    let derivation_data: CustodyAccountDerivationData = (&*accs).into();
    accs.custody
        .verify_derivation(ctx.program_id, &derivation_data)?;
    msg!("*** DEBUG *** transfer_native 03");

    // Verify mints
    if accs.from.mint != *accs.mint.info().key {
        return Err(TokenBridgeError::InvalidMint.into());
    }
    msg!("*** DEBUG *** transfer_native 04");

    // Fee must be less than amount
    if data.fee > data.amount {
        return Err(InvalidFee.into());
    }
    msg!("*** DEBUG *** transfer_native 05");

    // Verify that the token is not a wrapped token
    if let COption::Some(mint_authority) = accs.mint.mint_authority {
        if mint_authority == MintSigner::key(None, ctx.program_id) {
            return Err(TokenBridgeError::TokenNotNative.into());
        }
    }
    msg!("*** DEBUG *** transfer_native 06");

    if !accs.custody.is_initialized() {
        accs.custody
            .create(&(&*accs).into(), ctx, accs.payer.key, Exempt)?;
        msg!("*** DEBUG *** transfer_native 07");

        let init_ix = safe_token::instruction::initialize_account(
            &safe_token::id(),
            accs.custody.info().key,
            accs.mint.info().key,
            accs.custody_signer.key,
        )?;
        msg!("*** DEBUG *** transfer_native 08");

        invoke_signed(&init_ix, ctx.accounts, &[])?;
        msg!("*** DEBUG *** transfer_native 09");
    }

    let trunc_divisor = 10u64.pow(8.max(accs.mint.decimals as u32) - 8);
    // Truncate to 8 decimals
    let amount: u64 = data.amount / trunc_divisor;
    let fee: u64 = data.fee / trunc_divisor;
    // Untruncate the amount to drop the remainder so we don't  "burn" user's funds.
    let amount_trunc: u64 = amount * trunc_divisor;
    msg!("*** DEBUG *** transfer_native 10");

    // Transfer tokens
    let transfer_ix = safe_token::instruction::transfer(
        &safe_token::id(),
        accs.from.info().key,
        accs.custody.info().key,
        accs.authority_signer.key,
        &[],
        amount_trunc,
    )?;
    msg!("*** DEBUG *** transfer_native 11");

    invoke_seeded(&transfer_ix, ctx, &accs.authority_signer, None)?;
    msg!("*** DEBUG *** transfer_native 12");

    // Pay fee
    let transfer_ix = safecoin_program::system_instruction::transfer(
        accs.payer.key,
        accs.fee_collector.key,
        accs.bridge.config.fee,
    );
    msg!("*** DEBUG *** transfer_native 13");

    invoke(&transfer_ix, ctx.accounts)?;
    msg!("*** DEBUG *** transfer_native 14");

    // Post message
    let payload = PayloadTransfer {
        amount: U256::from(amount),
        token_address: accs.mint.info().key.to_bytes(),
        token_chain: CHAIN_ID_SAFECOIN,
        to: data.target_address,
        to_chain: data.target_chain,
        fee: U256::from(fee),
    };
    msg!("*** DEBUG *** transfer_native 15");

    let params = (
        bridge::instruction::Instruction::PostMessage,
        PostMessageData {
            nonce: data.nonce,
            payload: payload.try_to_vec()?,
            consistency_level: ConsistencyLevel::Finalized,
        },
    );
    msg!("*** DEBUG *** transfer_native 16");

    let ix = Instruction::new_with_bytes(
        accs.config.wormhole_bridge,
        params.try_to_vec()?.as_slice(),
        vec![
            AccountMeta::new(*accs.bridge.info().key, false),
            AccountMeta::new(*accs.message.key, true),
            AccountMeta::new_readonly(*accs.emitter.key, true),
            AccountMeta::new(*accs.sequence.key, false),
            AccountMeta::new(*accs.payer.key, true),
            AccountMeta::new(*accs.fee_collector.key, false),
            AccountMeta::new_readonly(*accs.clock.info().key, false),
            AccountMeta::new_readonly(safecoin_program::system_program::id(), false),
            AccountMeta::new_readonly(safecoin_program::sysvar::rent::ID, false),
        ],
    );
    msg!("*** DEBUG *** transfer_native 17");

    invoke_seeded(&ix, ctx, &accs.emitter, None)?;

    msg!("*** DEBUG *** transfer_native Ok");

    Ok(())
}

#[derive(FromAccounts)]
pub struct TransferWrapped<'b> {
    pub payer: Mut<Signer<AccountInfo<'b>>>,
    pub config: ConfigAccount<'b, { AccountState::Initialized }>,

    pub from: Mut<Data<'b, SplAccount, { AccountState::Initialized }>>,
    pub from_owner: MaybeMut<Signer<Info<'b>>>,
    pub mint: Mut<WrappedMint<'b, { AccountState::Initialized }>>,
    pub wrapped_meta: WrappedTokenMeta<'b, { AccountState::Initialized }>,

    pub authority_signer: AuthoritySigner<'b>,

    /// CPI Context
    pub bridge: Mut<CoreBridge<'b, { AccountState::Initialized }>>,

    /// Account to store the posted message
    pub message: Signer<Mut<Info<'b>>>,

    /// Emitter of the VAA
    pub emitter: EmitterAccount<'b>,

    /// Tracker for the emitter sequence
    pub sequence: Mut<Info<'b>>,

    /// Account to collect tx fee
    pub fee_collector: Mut<Info<'b>>,

    pub clock: Sysvar<'b, Clock>,
}

impl<'a> From<&TransferWrapped<'a>> for WrappedDerivationData {
    fn from(accs: &TransferWrapped<'a>) -> Self {
        WrappedDerivationData {
            token_chain: 1,
            token_address: accs.mint.info().key.to_bytes(),
        }
    }
}

impl<'a> From<&TransferWrapped<'a>> for WrappedMetaDerivationData {
    fn from(accs: &TransferWrapped<'a>) -> Self {
        WrappedMetaDerivationData {
            mint_key: *accs.mint.info().key,
        }
    }
}

impl<'b> InstructionContext<'b> for TransferWrapped<'b> {
}

#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct TransferWrappedData {
    pub nonce: u32,
    pub amount: u64,
    pub fee: u64,
    pub target_address: Address,
    pub target_chain: ChainID,
}

pub fn transfer_wrapped(
    ctx: &ExecutionContext,
    accs: &mut TransferWrapped,
    data: TransferWrappedData,
) -> Result<()> {
    msg!("*** DEBUG *** transfer_wrapped 01");
    // Prevent transferring to the same chain.
    if data.target_chain == CHAIN_ID_SAFECOIN {
        return Err(InvalidChain.into());
    }
    msg!("*** DEBUG *** transfer_wrapped 02");

    // Verify that the from account is owned by the from_owner
    if &accs.from.owner != accs.from_owner.key {
        return Err(WrongAccountOwner.into());
    }
    msg!("*** DEBUG *** transfer_wrapped 03");

    // Verify mints
    if accs.mint.info().key != &accs.from.mint {
        return Err(TokenBridgeError::InvalidMint.into());
    }
    msg!("*** DEBUG *** transfer_wrapped 04");

    // Fee must be less than amount
    if data.fee > data.amount {
        return Err(InvalidFee.into());
    }
    msg!("*** DEBUG *** transfer_wrapped 05");

    // Verify that meta is correct
    let derivation_data: WrappedMetaDerivationData = (&*accs).into();
    accs.wrapped_meta
        .verify_derivation(ctx.program_id, &derivation_data)?;
    msg!("*** DEBUG *** transfer_wrapped 06");

    // Burn tokens
    let burn_ix = safe_token::instruction::burn(
        &safe_token::id(),
        accs.from.info().key,
        accs.mint.info().key,
        accs.authority_signer.key,
        &[],
        data.amount,
    )?;
    msg!("*** DEBUG *** transfer_wrapped 07");

    invoke_seeded(&burn_ix, ctx, &accs.authority_signer, None)?;
    msg!("*** DEBUG *** transfer_wrapped 08");

    // Pay fee
    let transfer_ix = safecoin_program::system_instruction::transfer(
        accs.payer.key,
        accs.fee_collector.key,
        accs.bridge.config.fee,
    );
    msg!("*** DEBUG *** transfer_wrapped 09");

    invoke(&transfer_ix, ctx.accounts)?;
    msg!("*** DEBUG *** transfer_wrapped 10");

    // Post message
    let payload = PayloadTransfer {
        amount: U256::from(data.amount),
        token_address: accs.wrapped_meta.token_address,
        token_chain: accs.wrapped_meta.chain,
        to: data.target_address,
        to_chain: data.target_chain,
        fee: U256::from(data.fee),
    };
    msg!("*** DEBUG *** transfer_wrapped 11");

    let params = (
        bridge::instruction::Instruction::PostMessage,
        PostMessageData {
            nonce: data.nonce,
            payload: payload.try_to_vec()?,
            consistency_level: ConsistencyLevel::Finalized,
        },
    );
    msg!("*** DEBUG *** transfer_wrapped 12");

    let ix = Instruction::new_with_bytes(
        accs.config.wormhole_bridge,
        params.try_to_vec()?.as_slice(),
        vec![
            AccountMeta::new(*accs.bridge.info().key, false),
            AccountMeta::new(*accs.message.key, true),
            AccountMeta::new_readonly(*accs.emitter.key, true),
            AccountMeta::new(*accs.sequence.key, false),
            AccountMeta::new(*accs.payer.key, true),
            AccountMeta::new(*accs.fee_collector.key, false),
            AccountMeta::new_readonly(*accs.clock.info().key, false),
            AccountMeta::new_readonly(safecoin_program::system_program::id(), false),
            AccountMeta::new_readonly(safecoin_program::sysvar::rent::ID, false),
        ],
    );
    msg!("*** DEBUG *** transfer_wrapped 13");

    invoke_seeded(&ix, ctx, &accs.emitter, None)?;

    msg!("*** DEBUG *** transfer_wrapped Ok");
    Ok(())
}
