use crate::{
    accounts::{
        ConfigAccount,
        CoreBridge,
        EmitterAccount,
        SplTokenMeta,
        SplTokenMetaDerivationData,
        WrappedMetaDerivationData,
        WrappedTokenMeta,
    },
    messages::{
        PayloadAssetMeta,
        PayloadTransfer,
    },
    types::*,
    TokenBridgeError::{
        self,
        *,
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
    pubkey::Pubkey,
    sysvar::clock::Clock,
};
use solitaire::{
    processors::seeded::{
        invoke_seeded,
        Owned,
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
use safe_token_metadata::state::Metadata;
use std::ops::{
    Deref,
    DerefMut,
};

#[derive(FromAccounts)]
pub struct AttestToken<'b> {
    pub payer: Mut<Signer<AccountInfo<'b>>>,

    pub config: Mut<ConfigAccount<'b, { AccountState::Initialized }>>,

    /// Mint to attest
    pub mint: Data<'b, SplMint, { AccountState::Initialized }>,
    pub wrapped_meta: WrappedTokenMeta<'b, { AccountState::Uninitialized }>,

    /// SPL Metadata for the associated Mint
    pub safe_metadata: SplTokenMeta<'b>,

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

impl<'b> InstructionContext<'b> for AttestToken<'b> {
}

impl<'a> From<&AttestToken<'a>> for WrappedMetaDerivationData {
    fn from(accs: &AttestToken<'a>) -> Self {
        WrappedMetaDerivationData {
            mint_key: *accs.mint.info().key,
        }
    }
}

impl<'a> From<&AttestToken<'a>> for SplTokenMetaDerivationData {
    fn from(accs: &AttestToken<'a>) -> Self {
        SplTokenMetaDerivationData {
            mint: *accs.mint.info().key,
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct AttestTokenData {
    pub nonce: u32,
}

pub fn attest_token(
    ctx: &ExecutionContext,
    accs: &mut AttestToken,
    data: AttestTokenData,
) -> Result<()> {
    msg!("*** DEBUG *** attest_token 01");

    // Pay fee
    let transfer_ix = safecoin_program::system_instruction::transfer(
        accs.payer.key,
        accs.fee_collector.key,
        accs.bridge.config.fee,
    );
    msg!("*** DEBUG *** attest_token 02");

    invoke(&transfer_ix, ctx.accounts)?;
    msg!("*** DEBUG *** attest_token 03");

    // Enfoce wrapped meta to be uninitialized.
    let derivation_data: WrappedMetaDerivationData = (&*accs).into();
    msg!("*** DEBUG *** attest_token 04");

    accs.wrapped_meta
        .verify_derivation(ctx.program_id, &derivation_data)?;
    msg!("*** DEBUG *** attest_token 05");

    // Create Asset Metadata
    let mut payload = PayloadAssetMeta {
        token_address: accs.mint.info().key.to_bytes(),
        token_chain: CHAIN_ID_SAFECOIN,
        decimals: accs.mint.decimals,
        symbol: "".to_string(),
        name: "".to_string(),
    };
    msg!("*** DEBUG *** attest_token 06");

    // Assign metadata if an SPL Metadata account exists for the SPL token in question.
    if !accs.safe_metadata.data_is_empty() {
        let derivation_data: SplTokenMetaDerivationData = (&*accs).into();
        msg!("*** DEBUG *** attest_token 07");

        accs.safe_metadata
            .verify_derivation(&safe_token_metadata::id(), &derivation_data)?;
        msg!("*** DEBUG *** attest_token 08");

        if *accs.safe_metadata.owner != safe_token_metadata::id() {
            return Err(WrongAccountOwner.into());
        }
        msg!("*** DEBUG *** attest_token 09");

        let metadata: Metadata =
            Metadata::from_account_info(accs.safe_metadata.info())?;
        msg!("*** DEBUG *** attest_token 10");
        payload.name = metadata.data.name.clone();
        payload.symbol = metadata.data.symbol.clone();
    }
    msg!("*** DEBUG *** attest_token 11");

    let params = (
        bridge::instruction::Instruction::PostMessage,
        PostMessageData {
            nonce: data.nonce,
            payload: payload.try_to_vec()?,
            consistency_level: ConsistencyLevel::Finalized,
        },
    );
    msg!("*** DEBUG *** attest_token 12");

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
    msg!("*** DEBUG *** attest_token 13");

    invoke_seeded(&ix, ctx, &accs.emitter, None)?;

    msg!("*** DEBUG *** attest_token Ok");
    Ok(())
}
