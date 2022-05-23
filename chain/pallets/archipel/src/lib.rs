#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://substrate.dev/docs/en/knowledgebase/runtime/frame>

pub use pallet::*;


#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;


#[frame_support::pallet]
pub mod pallet {
	use frame_support::{
		dispatch::DispatchResult,
		pallet_prelude::*
	};
	use frame_system::pallet_prelude::*;

	/// Configure the pallet by specifying the parameters and types on which it depends.
	#[pallet::config]
	pub trait Config: frame_system::Config {
		/// Because this pallet emits events, it depends on the runtime's definition of an event.
		type Event: From<Event<Self>> + IsType<<Self as frame_system::Config>::Event>;
	}

	#[pallet::pallet]
	#[pallet::generate_store(pub(super) trait Store)]
	pub struct Pallet<T>(_);

	// Heartbeats storage
	#[pallet::storage]
	#[pallet::getter(fn get_heartbeat)]
	pub(super) type Heartbeats<T: Config> = StorageMap<_, Twox64Concat, T::AccountId, T::BlockNumber, ValueQuery>;

	// Status storage
	#[pallet::storage]
	#[pallet::getter(fn get_node_status)]
	pub(super) type NodesStatus<T: Config> = StorageMap<_, Twox64Concat, T::AccountId, u32, ValueQuery>;

	// Groups storage
	#[pallet::storage]
	#[pallet::getter(fn get_group)]
	pub(super) type Groups<T: Config> = StorageMap<_, Twox64Concat, T::AccountId, u32, ValueQuery>;

	// Current leaders storage
	#[pallet::storage]
	#[pallet::getter(fn get_leader)]
	pub(super) type Leaders<T: Config> = StorageMap<_, Twox64Concat, u32, T::AccountId, ValueQuery>;

	// Current leaders storage
	#[pallet::storage]
	#[pallet::getter(fn get_leaded_group)]
	pub(super) type LeadedGroup<T: Config> = StorageMap<_, Twox64Concat, u32, bool, ValueQuery>;

	// Accounts storage
	#[pallet::storage]
	#[pallet::getter(fn get_account)]
	pub(super) type Accounts<T: Config> = StorageMap<_, Twox64Concat, u32, T::AccountId, ValueQuery>;

	#[pallet::storage]
	#[pallet::getter(fn get_accounts_count)]
	pub type AccountsCount<T> = StorageValue<_, u32 >;

	#[pallet::storage]
	#[pallet::getter(fn get_accounts_index)]
	pub(super) type AccountsIndex<T: Config> = StorageMap<_, Twox64Concat, T::AccountId, u32, ValueQuery>;

	// Pallets use events to inform users when important changes are made.
	// https://substrate.dev/docs/en/knowledgebase/runtime/events
	#[pallet::event]
	#[pallet::metadata(T::AccountId = "AccountId", T::BlockNumber = "BlockNumber")]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		/// Event documentation should end with an array that provides descriptive names for event
		// Heartbeat event
		NewHeartbeat(T::AccountId, u32, u32, T::BlockNumber),
		// New leader event
		NewLeader(T::AccountId, u32),
		// Give up Leader event
		GiveUpLeader(T::AccountId, u32),
	}


	#[pallet::hooks]
	impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {}

	impl<T: Config> Pallet<T> {
		// Adding account
		fn add_account(account: &T::AccountId) -> DispatchResult {
			// Checking if account exists already in storage
			if ! <AccountsIndex<T>>::contains_key(&account) {
				let accounts_count = Self::get_accounts_count().unwrap_or(0);

				// Incrementing accounts count and preventing overflow
				let new_accounts_count = accounts_count
					.saturating_add(1);

				// Adding account to account storage
				<Accounts<T>>::insert(accounts_count, account);
				<AccountsCount<T>>::put(new_accounts_count);
				<AccountsIndex<T>>::insert(account, accounts_count);
			}
			Ok(())
		}
	}

	// Dispatchable functions allows users to interact with the pallet and invoke state changes.
	// These functions materialize as "extrinsics", which are often compared to transactions.
	// Dispatchable functions must be annotated with a weight and must return a DispatchResult.
	#[pallet::call]
	impl<T:Config> Pallet<T> {

		#[pallet::weight(10_000 + T::DbWeight::get().reads_writes(1,2))]
		pub fn set_leader(origin: OriginFor<T>, old_leader: T::AccountId, group_id: u32) -> DispatchResult {
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

			<LeadedGroup<T>>::insert(group_id, true);

            // Triggering leader update event
            Self::deposit_event(Event::NewLeader(sender, group_id));

            Ok(())
		}

		#[pallet::weight(10_000 + T::DbWeight::get().reads_writes(2,2))]
		pub fn give_up_leadership(origin: OriginFor<T>, group_id: u32) -> DispatchResult {

			let sender: T::AccountId = ensure_signed(origin)?;

			let leaded_group = Self::get_leaded_group(group_id);

			ensure!(leaded_group ==  true, "No Leader in this group.");

			let leader =  Self::get_leader(group_id);
		
			ensure!(leader ==  sender, "You are not the current leader.");

			<LeadedGroup<T>>::insert(group_id, false);

			<Leaders<T>>::remove(group_id);

			Self::deposit_event(Event::GiveUpLeader(sender, group_id));

			Ok(())
		}

		#[pallet::weight(10_000 + T::DbWeight::get().reads_writes(2,6))]
        // Add hearthbeats
        pub fn add_heartbeat(origin: OriginFor<T>, group_id: u32, node_status: u32) -> DispatchResult {
			let sender: T::AccountId = ensure_signed(origin)?;

			let now = frame_system::Pallet::<T>::block_number();
	
            // Adding account in map
            Self::add_account(&sender)?;

            // Adding sender into groups map
            <Groups<T>>::insert(&sender, group_id);

            // Adding Now into Heartbeats map
			<Heartbeats<T>>::insert(&sender, now);
			
			// Adding node status into NodesStatus map
			<NodesStatus<T>>::insert(&sender, node_status);

            // Triggering heartbeats update event
            Self::deposit_event(Event::NewHeartbeat(sender, group_id, node_status, now));

            Ok(())
        }

	}
}
