use frame_support::{decl_event, decl_module, decl_storage, dispatch::DispatchResult, ensure};
use {system::ensure_signed, timestamp};

/// The module's configuration trait.
pub trait Trait: timestamp::Trait + system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

// This module's storage items.
decl_storage! {
    trait Store for Module<T: Trait> as ArchipelModule {
        // Heartbeats storage
        Heartbeats get(get_heartbeats): map T::AccountId => T::Moment;
        // Metrics storage
        Metrics get(get_metrics): map T::AccountId => u32;
        // Current leader storage
        Leader get(get_leader): Option<T::AccountId> = None;
        // Accounts storage
        Accounts get(get_account): map u32 => T::AccountId;
        AccountsCount get(get_accounts_count): u32 = 0;
        AccountsIndex get(get_accounts_index): map T::AccountId => u32;
    }
}

// The module's dispatchable functions.
decl_module! {
    /// The module declaration.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        // Initializing events
        // this is needed only if you are using events in your module
        fn deposit_event() = default;

        fn set_leader(origin, old_leader: T::AccountId) -> DispatchResult {
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

        // Add metrics
        fn add_metrics(origin, metrics_value: u32) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // Get timestamp
            let now = <timestamp::Module<T>>::get();

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

decl_event!(
    pub enum Event<T>
    where
        AccountId = <T as system::Trait>::AccountId,
        Moment = <T as timestamp::Trait>::Moment,
    {
        // Metics updated event
        MetricsUpdated(AccountId, u32, Moment),
        // Leader changed event
        NewLeader(AccountId),
    }
);

impl<T: Trait> Module<T> {
    // Adding account
    fn add_account(account: &T::AccountId) -> DispatchResult {
        // Checking if account exists already in storage
        if !<AccountsIndex<T>>::exists(account) {
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

/// Test for this module
#[cfg(test)]
mod tests {
    use super::*;

    use frame_support::{
        assert_noop, assert_ok, impl_outer_event, impl_outer_origin, parameter_types,
        weights::Weight,
    };
    use sp_core::H256;
    use sp_runtime::{
        testing::Header,
        traits::{BlakeTwo256, IdentityLookup},
        Perbill,
    };

    impl_outer_origin! {
        pub enum Origin for TestArchipel {}
    }

    #[derive(Clone, Eq, PartialEq, Debug)]
    pub struct TestArchipel;
    parameter_types! {
        pub const BlockHashCount: u64 = 250;
        pub const MaximumBlockWeight: Weight = 1024;
        pub const MaximumBlockLength: u32 = 2 * 1024;
        pub const AvailableBlockRatio: Perbill = Perbill::from_percent(75);
        pub const MinimumPeriod: u64 = 5;
    }
    impl system::Trait for TestArchipel {
        type Origin = Origin;
        type Call = ();
        type Index = u64;
        type BlockNumber = u64;
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = TestEvent;
        type BlockHashCount = BlockHashCount;
        type MaximumBlockWeight = MaximumBlockWeight;
        type MaximumBlockLength = MaximumBlockLength;
        type AvailableBlockRatio = AvailableBlockRatio;
        type Version = ();
        type ModuleToIndex = ();
    }

    mod archipel {
        pub use crate::archipel::Event;
    }

    impl_outer_event! {
        pub enum TestEvent for TestArchipel {
            archipel<T>,
        }
    }

    impl Trait for TestArchipel {
        type Event = TestEvent;
    }

    impl timestamp::Trait for TestArchipel {
        type Moment = u64;
        type OnTimestampSet = ();
        type MinimumPeriod = MinimumPeriod;
    }

    pub type ArchipelModule = Module<TestArchipel>;
    pub type System = system::Module<TestArchipel>;
    pub type Timestamp = timestamp::Module<TestArchipel>;

    pub struct ExtBuilder;

    impl ExtBuilder {
        pub fn build() -> sp_io::TestExternalities {
            let storage = system::GenesisConfig::default()
                .build_storage::<TestArchipel>()
                .unwrap();
            sp_io::TestExternalities::from(storage)
        }
    }

    #[test]
    fn set_leader_should_work() {
        ExtBuilder::build().execute_with(|| {
            // set leader
            assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0));

            // check if leader was correctly set
            assert_eq!(ArchipelModule::get_leader(), Some(10));
        })
    }

    #[test]
    fn wrong_old_leader_should_fail() {
        ExtBuilder::build().execute_with(|| {
            // set leader
            assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0));

            // wrong old leader
            assert_noop!(
                ArchipelModule::set_leader(Origin::signed(10), 0),
                "Incorrect old leader report."
            );
        })
    }

    #[test]
    fn me_old_leader_should_fail() {
        ExtBuilder::build().execute_with(|| {
            // set leader
            assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0));

            // the same old leader
            assert_noop!(
                ArchipelModule::set_leader(Origin::signed(10), 10),
                "You are already leader."
            );
        })
    }

    #[test]
    fn change_leader_should_work() {
        ExtBuilder::build().execute_with(|| {
            // set leader
            assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0));

            // change leader
            assert_ok!(ArchipelModule::set_leader(Origin::signed(20), 10));

            // check if leader was correctly changed
            assert_eq!(ArchipelModule::get_leader(), Some(20));
        })
    }

    #[test]
    fn add_metrics_should_work() {
        ExtBuilder::build().execute_with(|| {
            // set metrics
            assert_ok!(ArchipelModule::add_metrics(Origin::signed(10), 4242));

            // checking if account was successfully added to structures
            assert_eq!(ArchipelModule::get_accounts_count(), 1);
            assert_eq!(ArchipelModule::get_accounts_index(10), 0);
            assert_eq!(ArchipelModule::get_account(0), 10);

            // check metrics
            assert_eq!(ArchipelModule::get_metrics(10), 4242);
        })
    }
    #[test]
    fn update_metrics_should_work() {
        ExtBuilder::build().execute_with(|| {
            // set metrics 1
            assert_ok!(ArchipelModule::add_metrics(Origin::signed(10), 4242));

            // set metrics 2
            assert_ok!(ArchipelModule::add_metrics(Origin::signed(10), 4243));

            // checking if account structure was not altered
            assert_eq!(ArchipelModule::get_accounts_count(), 1);
            assert_eq!(ArchipelModule::get_accounts_index(10), 0);
            assert_eq!(ArchipelModule::get_account(0), 10);

            // checking updated metrics
            assert_eq!(ArchipelModule::get_metrics(10), 4243);
        })
    }
    #[test]
    fn update_metrics_event_should_work() {
        ExtBuilder::build().execute_with(|| {
            // Set metrics
            assert_ok!(ArchipelModule::add_metrics(Origin::signed(10), 65));

            // construct event that should be emitted in the method call directly above
            let expected_event = TestEvent::archipel(RawEvent::MetricsUpdated(10, 65, 0));

            // iterate through array of `EventRecord`s
            assert!(System::events().iter().any(|a| a.event == expected_event));
        })
    }
    #[test]
    fn set_leader_event_should_work() {
        ExtBuilder::build().execute_with(|| {
            // set leader
            assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0));

            // construct event that should be emitted in the method call directly above
            let expected_event = TestEvent::archipel(RawEvent::NewLeader(10));

            // iterate through array of `EventRecord`s
            assert!(System::events().iter().any(|a| a.event == expected_event));
        })
    }
    #[test]
    fn check_timestamp_update_metrics_event_should_work() {
        ExtBuilder::build().execute_with(|| {
            // Set timestamp
            Timestamp::set_timestamp(42);

            // Set metrics
            assert_ok!(ArchipelModule::add_metrics(Origin::signed(10), 65));

            // construct event that should be emitted in the method call directly above
            let expected_event = TestEvent::archipel(RawEvent::MetricsUpdated(10, 65, 42));

            // iterate through array of `EventRecord`s
            assert!(System::events().iter().any(|a| a.event == expected_event));
        })
    }
}
