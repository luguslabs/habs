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
		Heartbeats get( fn get_heartbeat): map hasher(blake2_128_concat) T::AccountId => T::BlockNumber;
		// Status storage
		NodesStatus get( fn get_node_status): map hasher(blake2_128_concat) T::AccountId => u32 = 0;
		// Groups storage
		Groups get(fn get_group): map hasher(blake2_128_concat) T::AccountId => u32;
		// Current leaders storage
		Leaders get(fn get_leader): map hasher(blake2_128_concat) u32 => T::AccountId;
		LeadedGroup get(fn get_leaded_group): map hasher(blake2_128_concat) u32 => bool = false;
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
		// Heartbeat event
		NewHeartbeat(AccountId, u32, u32, BlockNumber),
		
		// New leader event
		NewLeader(AccountId, u32),

		// Give up Leader event
		GiveUpLeader(AccountId, u32),
	}
);

// Dispatchable functions allows users to interact with the pallet and invoke state changes.
// These functions materialize as "extrinsics", which are often compared to transactions.
// Dispatchable functions must be annotated with a weight and must return a DispatchResult.
decl_module! {
	pub struct Module<T: Trait> for enum Call where origin: T::Origin {

		// Events must be initialized if they are used by the pallet.
		fn deposit_event() = default;

		#[weight = 10_000 + T::DbWeight::get().reads_writes(1,2)]
		pub fn set_leader(origin, old_leader: T::AccountId, group_id: u32) -> dispatch::DispatchResult {
            let sender: T::AccountId = ensure_signed(origin)?;

			// If leader is already set by someone in this group
			if <Leaders<T>>::contains_key(&group_id) {
				let leader =  Self::get_leader(group_id);
				// Checking if leader can be set
				ensure!(sender != old_leader, "You are already leader.");
				ensure!(old_leader ==  leader, "Incorrect old leader report.");
			}

            // Updating leader for group id
			<Leaders<T>>::insert(group_id, &sender);

			<LeadedGroup>::insert(group_id, true);

            // Triggering leader update event
            Self::deposit_event(RawEvent::NewLeader(sender, group_id));

            Ok(())
		}

		#[weight = 10_000 + T::DbWeight::get().reads_writes(2,2)]
		pub fn give_up_leadership(origin, group_id: u32) -> dispatch::DispatchResult {

			let sender: T::AccountId = ensure_signed(origin)?;

			let leaded_group = Self::get_leaded_group(group_id);

			ensure!(leaded_group ==  true, "No Leader in this group.");

			let leader =  Self::get_leader(group_id);
		
			ensure!(leader ==  sender, "You are not the current leader.");

			<LeadedGroup>::insert(group_id, false);

			<Leaders<T>>::remove(group_id);

			Self::deposit_event(RawEvent::GiveUpLeader(sender, group_id));

			Ok(())
		}


		#[weight = 10_000 + T::DbWeight::get().reads_writes(2,6)]
        // Add hearthbeats
        pub fn add_heartbeat(origin, group_id: u32, node_status: u32) -> dispatch::DispatchResult {
			let sender = ensure_signed(origin)?;

			let now = <system::Module<T>>::block_number();
	
            // Adding account in map
            Self::add_account(&sender)?;

            // Adding sender into groups map
            <Groups<T>>::insert(&sender, group_id);

            // Adding Now into Heartbeats map
			<Heartbeats<T>>::insert(&sender, now);
			
			// Adding node status into NodesStatus map
			<NodesStatus<T>>::insert(&sender, node_status);

            // Triggering heartbeats update event
            Self::deposit_event(RawEvent::NewHeartbeat(sender, group_id, node_status, now));

            Ok(())
        }


	}
}
