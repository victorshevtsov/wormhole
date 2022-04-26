//! Peeling.
//!
//! The accounts in Solitaire programs are defined via layers of types, when each layer is peeled
//! off it performs checks, parsing, and any other desired side-effect. The mechanism for this is
//! the peel trait, which defines a set of types that recursively construct the desired type.

use borsh::BorshDeserialize;
use safecoin_program::{
    msg,
    pubkey::Pubkey,
    system_program,
    sysvar::{
        self,
        Sysvar as SafecoinSysvar,
        SysvarId,
    },
};
use std::marker::PhantomData;

use crate::{
    processors::seeded::{
        AccountOwner,
        Owned,
    },
    types::*,
    AccountState::MaybeInitialized,
    Context,
    Result,
    SolitaireError,
};
use borsh::BorshSerialize;

/// Generic Peel trait. This provides a way to describe what each "peeled"
/// layer of our constraints should check.
pub trait Peel<'a, 'b: 'a, 'c> {
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self>
    where
        Self: Sized;

    fn deps() -> Vec<Pubkey>;

    fn persist(&self, program_id: &Pubkey) -> Result<()>;
}

/// Peel a Derived Key
impl<'a, 'b: 'a, 'c, T: Peel<'a, 'b, 'c>, const Seed: &'static str> Peel<'a, 'b, 'c>
    for Derive<T, Seed>
{
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for Derive 01");

        // Attempt to Derive Seed
        let (derived, bump) = Pubkey::find_program_address(&[Seed.as_ref()], ctx.this);
        msg!("*** DEBUG *** impl Peel for Derive 02");

        match derived == *ctx.info().key {
            true => T::peel(ctx).map(|v| Derive(v)),
            _ => Err(SolitaireError::InvalidDerive(*ctx.info().key, derived).into()),
        }
    }

    fn deps() -> Vec<Pubkey> {
        T::deps()
    }

    fn persist(&self, program_id: &Pubkey) -> Result<()> {
        T::persist(self, program_id)
    }
}

/// Peel a Mutable key.
impl<'a, 'b: 'a, 'c, T: Peel<'a, 'b, 'c>> Peel<'a, 'b, 'c> for Mut<T> {
    fn peel<I>(mut ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for Mut 01");

        ctx.immutable = false;
        match ctx.info().is_writable {
            true => T::peel(ctx).map(|v| Mut(v)),
            _ => Err(
                SolitaireError::InvalidMutability(*ctx.info().key, ctx.info().is_writable).into(),
            ),
        }
    }

    fn deps() -> Vec<Pubkey> {
        T::deps()
    }

    fn persist(&self, program_id: &Pubkey) -> Result<()> {
        T::persist(self, program_id)
    }
}

impl<'a, 'b: 'a, 'c, T: Peel<'a, 'b, 'c>> Peel<'a, 'b, 'c> for MaybeMut<T> {
    fn peel<I>(mut ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for MaybeMut 01");

        ctx.immutable = !ctx.info().is_writable;
        T::peel(ctx).map(|v| MaybeMut(v))
    }

    fn deps() -> Vec<Pubkey> {
        T::deps()
    }

    fn persist(&self, program_id: &Pubkey) -> Result<()> {
        T::persist(self, program_id)
    }
}

/// Peel a Signer.
impl<'a, 'b: 'a, 'c, T: Peel<'a, 'b, 'c>> Peel<'a, 'b, 'c> for Signer<T> {
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for Signer 01");

        match ctx.info().is_signer {
            true => T::peel(ctx).map(|v| Signer(v)),
            _ => Err(SolitaireError::InvalidSigner(*ctx.info().key).into()),
        }
    }

    fn deps() -> Vec<Pubkey> {
        T::deps()
    }

    fn persist(&self, program_id: &Pubkey) -> Result<()> {
        T::persist(self, program_id)
    }
}

/// Expicitly depend upon the System account.
impl<'a, 'b: 'a, 'c, T: Peel<'a, 'b, 'c>> Peel<'a, 'b, 'c> for System<T> {
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for System 01");

        match true {
            true => T::peel(ctx).map(|v| System(v)),
            _ => panic!(),
        }
    }

    fn deps() -> Vec<Pubkey> {
        T::deps()
    }

    fn persist(&self, program_id: &Pubkey) -> Result<()> {
        T::persist(self, program_id)
    }
}

/// Peel a Sysvar
impl<'a, 'b: 'a, 'c, Var> Peel<'a, 'b, 'c> for Sysvar<'b, Var>
where
    Var: SafecoinSysvar,
{
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for Sysvar 01");

        match Var::check_id(ctx.info().key) {
            true => Ok(Sysvar(
                ctx.info().clone(),
                Var::from_account_info(ctx.info())?,
            )),
            _ => Err(SolitaireError::InvalidSysvar(*ctx.info().key).into()),
        }
    }

    fn deps() -> Vec<Pubkey> {
        vec![]
    }

    fn persist(&self, _program_id: &Pubkey) -> Result<()> {
        Ok(())
    }
}

/// This is our structural recursion base case, the trait system will stop generating new nested
/// calls here.
impl<'a, 'b: 'a, 'c> Peel<'a, 'b, 'c> for Info<'b> {
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for Info 01");

        if ctx.immutable && ctx.info().is_writable {
            msg!("*** DEBUG *** impl Peel for Info 02");

            return Err(
                SolitaireError::InvalidMutability(*ctx.info().key, ctx.info().is_writable).into(),
            );
        }

        msg!("*** DEBUG *** impl Peel for Info Ok");

        Ok(ctx.info().clone())
    }
    fn deps() -> Vec<Pubkey> {
        vec![]
    }
    fn persist(&self, _program_id: &Pubkey) -> Result<()> {
        Ok(())
    }
}

/// This is our structural recursion base case, the trait system will stop generating new nested
/// calls here.
impl<
        'a,
        'b: 'a,
        'c,
        T: BorshDeserialize + BorshSerialize + Owned + Default,
        const IsInitialized: AccountState,
    > Peel<'a, 'b, 'c> for Data<'b, T, IsInitialized>
{
    fn peel<I>(ctx: &'c mut Context<'a, 'b, 'c, I>) -> Result<Self> {
        msg!("*** DEBUG *** impl Peel for Data 01");

        if ctx.immutable && ctx.info().is_writable {
            msg!("*** DEBUG *** impl Peel for Data 02");

            return Err(
                SolitaireError::InvalidMutability(*ctx.info().key, ctx.info().is_writable).into(),
            );
        }
        msg!("*** DEBUG *** impl Peel for Data 03");

        // If we're initializing the type, we should emit system/rent as deps.
        let (initialized, data): (bool, T) = match IsInitialized {
            AccountState::Uninitialized => {
                if **ctx.info().lamports.borrow() != 0 {
                    msg!("*** DEBUG *** impl Peel for Data 04");

                    return Err(SolitaireError::AlreadyInitialized(*ctx.info().key));
                }
                (false, T::default())
            }
            AccountState::Initialized => {
                msg!("*** DEBUG *** impl Peel for Data 05");

                (true, T::try_from_slice(&mut *ctx.info().data.borrow_mut())?)
            }
            AccountState::MaybeInitialized => {
                msg!("*** DEBUG *** impl Peel for Data 06");

                if **ctx.info().lamports.borrow() == 0 {
                    (false, T::default())
                } else {
                    (true, T::try_from_slice(&mut *ctx.info().data.borrow_mut())?)
                }
            }
        };

        msg!("*** DEBUG *** impl Peel for Data 07");

        if initialized {
            match data.owner() {
                AccountOwner::This => {
                    if ctx.info().owner != ctx.this {
                        msg!("*** DEBUG *** impl Peel for Data 08");

                        return Err(SolitaireError::InvalidOwner(*ctx.info().owner));
                    }
                }
                AccountOwner::Other(v) => {
                    if *ctx.info().owner != v {
                        msg!("*** DEBUG *** impl Peel for Data 09");

                        return Err(SolitaireError::InvalidOwner(*ctx.info().owner));
                    }
                }
                AccountOwner::Any => {}
            };
        }

        msg!("*** DEBUG *** impl Peel for Data Ok");

        Ok(Data(Box::new(ctx.info().clone()), data))
    }

    fn deps() -> Vec<Pubkey> {
        if IsInitialized == AccountState::Initialized {
            return vec![];
        }

        vec![sysvar::rent::ID, system_program::ID]
    }

    fn persist(&self, program_id: &Pubkey) -> Result<()> {
        // TODO: Introduce Mut<> to solve the check we really want to make here.
        if self.0.owner != program_id {
            return Ok(());
        }

        // It is also a malformed program to attempt to write to a non-writeable account.
        if !self.0.is_writable {
            return Ok(());
        }

        self.1.serialize(&mut *self.0.data.borrow_mut())?;

        Ok(())
    }
}
