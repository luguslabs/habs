#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// https://substrate.dev/docs/en/knowledgebase/runtime/frame

use frame_support::{decl_module, decl_storage, decl_event, dispatch, traits::Get, ensure};
use frame_system::{self as system, ensure_signed};


#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;


/// Configure the pallet by specifying the parameters and types on which it depends.
pub trait Trait: frame_system::Trait {
	/// Because this pallet emits events, it depends on the runtime's definition of an event.
	type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;
}

impl<T: Trait> Module<T> {

    // Adding account
    fn add_account(account: &T::AccountId) -> dispatch::DispatchResult {
		// Checking if account exists already in storage
        if ! <AccountsIndex<T>>::contains_key(&account) {
            let accounts_count = Self::get_accounts_count();

            // Incrementing accounts count and preventing overflow
            let new_accounts_count = accounts_count
                .checked_add(1)
                .ok_or("Overflow adding new node.")?;

            // Adding account to account storage
            <Accounts<T>>::insert(accounts_count, account);
            <AccountsCount>::put(new_accounts_count);
            <AccountsIndex<T>>::insert(account, accounts_count);
        }
        Ok(())
    }
}

// The pallet's runtime storage items.
// https://substrate.dev/docs/en/knowledgebase/runtime/storage
decl_storage! {
	// A unique name is used to ensure that the pallet's storage items are isolated.
	// This name may be updated, but each pallet in the runtime must use a unique name.
	// ---------------------------------vvvvvvvvvvvvvv
	trait Store for Module<T: Trait> as ArchipelModule {
		// Learn more about declaring storage items:
		// https://substrate.dev/docs/en/knowledgebase/runtime/storage#declaring-storage-items

		// Heartbeats storage
		Heartbeats get( fn get_heartbeats): map hasher(blake2_128_concat) T::AccountId => T::BlockNumber;
		// Metrics storage
		Metrics get(fn get_metrics): map hasher(blake2_128_concat) T::AccountId => u32;
		// Current leader storage
		Leader get(fn get_leader): Option<T::AccountId> = None;
		// Accounts storage
		Accounts get(fn get_account): map hasher(blake2_128_concat) u32 => T::AccountId;
		AccountsCount get(fn get_accounts_count): u32 = 0;
		AccountsIndex get(fn get_accounts_index): map hasher(blake2_128_concat) T::AccountId => u32;
	}
}

// Pallets use events to inform users when important changes are made.
// https://substrate.dev/docs/en/knowledgebase/runtime/events
decl_event!(
	pub enum Event<T>
    where
		AccountId = <T as frame_system::Trait>::AccountId,
		BlockNumber = <T as system::Trait>::BlockNumber,
    {
		// Metics updated event
		MetricsUpdated(AccountId, u32, BlockNumber),

		// Leader changed event
		NewLeader(AccountId),
	}
);

// Dispatchable functions allows users to interact with the pallet and invoke state changes.
// These functions materialize as "extrinsics", which are often compared to transactions.
// Dispatchable functions must be annotated with a weight and must return a DispatchResult.
decl_module! {
	pub struct Module<T: Trait> for enum Call where origin: T::Origin {

		// Events must be initialized if they are used by the pallet.
		fn deposit_event() = default;

		#[weight = 10_000 + T::DbWeight::get().reads_writes(1,1)]
		pub fn set_leader(origin, old_leader: T::AccountId) -> dispatch::DispatchResult {
            let sender = ensure_signed(origin)?;

            let leader = Self::get_leader();

            // If leader is already set by someone
            if let Some(current_leader) = leader {
                // Checking if leader can be set
                ensure!(sender != old_leader, "You are already leader.");
                ensure!(old_leader == current_leader, "Incorrect old leader report.");
            }

            // Updating leader
            <Leader<T>>::put(&sender);

            // Triggering leader update event
            Self::deposit_event(RawEvent::NewLeader(sender));

            Ok(())
		}

		#[weight = 10_000 + T::DbWeight::get().reads_writes(1,5)]
        // Add metrics
        pub fn add_metrics(origin, metrics_value: u32) -> dispatch::DispatchResult {
			let sender = ensure_signed(origin)?;

			let now = <system::Module<T>>::block_number();
	
            // Adding account in map
            Self::add_account(&sender)?;

            // Adding metrics into metrics map
            <Metrics<T>>::insert(&sender, metrics_value);

            // Adding Moment into Heartbeats map
            <Heartbeats<T>>::insert(&sender, now);

            // Triggering metrics update event
            Self::deposit_event(RawEvent::MetricsUpdated(sender, metrics_value, now));

            Ok(())
        }


	}
}
