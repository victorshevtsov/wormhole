use borsh::{
    BorshDeserialize,
    BorshSerialize,
};
use serde::{
    Deserialize,
    Serialize,
};
use safecoin_program::pubkey::Pubkey;
use solitaire::{
    pack_type,
    processors::seeded::{
        AccountOwner,
        Owned,
    },
};
use safe_token::state::{
    Account,
    Mint,
};
use safe_token_metadata::state::Metadata;

pub type Address = [u8; 32];
pub type ChainID = u16;

#[derive(Default, Clone, Copy, BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct Config {
    pub wormhole_bridge: Pubkey,
}

impl Owned for Config {
    fn owner(&self) -> AccountOwner {
        AccountOwner::This
    }
}

#[derive(Default, Clone, Copy, BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct EndpointRegistration {
    pub chain: ChainID,
    pub contract: Address,
}

impl Owned for EndpointRegistration {
    fn owner(&self) -> AccountOwner {
        AccountOwner::This
    }
}

#[derive(Default, Clone, Copy, BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct WrappedMeta {
    pub chain: ChainID,
    pub token_address: Address,
    pub original_decimals: u8,
}

impl Owned for WrappedMeta {
    fn owner(&self) -> AccountOwner {
        AccountOwner::This
    }
}

pack_type!(SplMint, Mint, AccountOwner::Other(safe_token::id()));
pack_type!(SplAccount, Account, AccountOwner::Other(safe_token::id()));
