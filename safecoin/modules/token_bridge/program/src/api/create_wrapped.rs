use crate::{
    accounts::{
        ConfigAccount,
        Endpoint,
        EndpointDerivationData,
        MintSigner,
        SplTokenMeta,
        SplTokenMetaDerivationData,
        WrappedDerivationData,
        WrappedMetaDerivationData,
        WrappedMint,
        WrappedTokenMeta,
    },
    messages::PayloadAssetMeta,
    types::*,
    TokenBridgeError::InvalidChain,
};
use bridge::{
    vaa::ClaimableVAA,
    CHAIN_ID_SAFECOIN,
};
use safecoin_program::{
    account_info::AccountInfo,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
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
use std::{
    cmp::min,
    ops::{
        Deref,
        DerefMut,
    },
};

#[derive(FromAccounts)]
pub struct CreateWrapped<'b> {
    pub payer: Mut<Signer<AccountInfo<'b>>>,
    pub config: ConfigAccount<'b, { AccountState::Initialized }>,

    pub chain_registration: Endpoint<'b, { AccountState::Initialized }>,
    pub vaa: ClaimableVAA<'b, PayloadAssetMeta>,

    // New Wrapped
    pub mint: Mut<WrappedMint<'b, { AccountState::Uninitialized }>>,
    pub meta: Mut<WrappedTokenMeta<'b, { AccountState::Uninitialized }>>,

    /// SPL Metadata for the associated Mint
    pub safe_metadata: Mut<SplTokenMeta<'b>>,

    pub mint_authority: MintSigner<'b>,
}

impl<'a> From<&CreateWrapped<'a>> for EndpointDerivationData {
    fn from(accs: &CreateWrapped<'a>) -> Self {
        EndpointDerivationData {
            emitter_chain: accs.vaa.meta().emitter_chain,
            emitter_address: accs.vaa.meta().emitter_address,
        }
    }
}

impl<'a> From<&CreateWrapped<'a>> for WrappedDerivationData {
    fn from(accs: &CreateWrapped<'a>) -> Self {
        WrappedDerivationData {
            token_chain: accs.vaa.token_chain,
            token_address: accs.vaa.token_address,
        }
    }
}

impl<'a> From<&CreateWrapped<'a>> for WrappedMetaDerivationData {
    fn from(accs: &CreateWrapped<'a>) -> Self {
        WrappedMetaDerivationData {
            mint_key: *accs.mint.info().key,
        }
    }
}

impl<'b> InstructionContext<'b> for CreateWrapped<'b> {
}

#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct CreateWrappedData {}

pub fn create_wrapped(
    ctx: &ExecutionContext,
    accs: &mut CreateWrapped,
    data: CreateWrappedData,
) -> Result<()> {
    use bstr::ByteSlice;

    // Do not process attestations sourced from the current chain.
    if accs.vaa.token_chain == CHAIN_ID_SAFECOIN {
        return Err(InvalidChain.into());
    }

    let derivation_data: WrappedDerivationData = (&*accs).into();
    accs.mint
        .verify_derivation(ctx.program_id, &derivation_data)?;

    let meta_derivation_data: WrappedMetaDerivationData = (&*accs).into();
    accs.meta
        .verify_derivation(ctx.program_id, &meta_derivation_data)?;

    let derivation_data: EndpointDerivationData = (&*accs).into();
    accs.chain_registration
        .verify_derivation(ctx.program_id, &derivation_data)?;

    accs.vaa.verify(ctx.program_id)?;
    accs.vaa.claim(ctx, accs.payer.key)?;

    // Create mint account
    accs.mint
        .create(&((&*accs).into()), ctx, accs.payer.key, Exempt)?;

    // Initialize mint
    let init_ix = safe_token::instruction::initialize_mint(
        &safe_token::id(),
        accs.mint.info().key,
        accs.mint_authority.key,
        None,
        min(8, accs.vaa.decimals), // Limit to 8 decimals, truncation is handled on the other side
    )?;
    invoke_signed(&init_ix, ctx.accounts, &[])?;

    // Create meta account
    accs.meta
        .create(&((&*accs).into()), ctx, accs.payer.key, Exempt)?;

    // Initialize spl meta
    accs.safe_metadata.verify_derivation(
        &safe_token_metadata::id(),
        &SplTokenMetaDerivationData {
            mint: *accs.mint.info().key,
        },
    )?;

    let mut name = accs.vaa.name.clone().as_bytes().to_vec();
    name.truncate(32 - 11);
    let mut name: Vec<char> = name.chars().collect();
    name.retain(|&c| c != '\u{FFFD}');
    let mut name: String = name.iter().collect();
    name += " (Wormhole)";

    let mut symbol = accs.vaa.symbol.clone().as_bytes().to_vec();
    symbol.truncate(10);
    let mut symbol: Vec<char> = symbol.chars().collect();
    symbol.retain(|&c| c != '\u{FFFD}');
    let symbol: String = symbol.iter().collect();

    let safe_token_metadata_ix = safe_token_metadata::instruction::create_metadata_accounts(
        safe_token_metadata::id(),
        *accs.safe_metadata.key,
        *accs.mint.info().key,
        *accs.mint_authority.info().key,
        *accs.payer.info().key,
        *accs.mint_authority.info().key,
        name,
        symbol,
        String::from(""),
        None,
        0,
        false,
        true,
    );
    invoke_seeded(&safe_token_metadata_ix, ctx, &accs.mint_authority, None)?;

    // Populate meta account
    accs.meta.chain = accs.vaa.token_chain;
    accs.meta.token_address = accs.vaa.token_address;
    accs.meta.original_decimals = accs.vaa.decimals;

    Ok(())
}
