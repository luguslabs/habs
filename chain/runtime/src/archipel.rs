use frame_support::{decl_module, decl_storage, decl_event, ensure, dispatch::DispatchResult};
use system::ensure_signed;

/// The module's configuration trait.
pub trait Trait: system::Trait {
	/// The overarching event type.
	type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

// This module's storage items.
decl_storage! {
	trait Store for Module<T: Trait> as ArchipelModule {
        // Metrics storage
        Metrics get(get_metrics): map T::AccountId => u32;
        // Current master storage
        Master get(get_master): Option<T::AccountId> = None;
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

		fn set_master(origin, old_master: T::AccountId) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            let master = Self::get_master();

            // If master is already set by someone
            if let Some(current_master) = master {
                // Checking if master can be set
                ensure!(sender != old_master, "You are already master");
                ensure!(old_master == current_master, "Incorrect old master report");
            }

            // Updating master value
            <Master<T>>::put(&sender);

            // Triggering master update event
            Self::deposit_event(RawEvent::NewMaster(sender));
            
            Ok(())
        }

        // Add metrics
        fn add_metrics(origin, metrics_value: u32) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // Adding account in map
            Self::add_account(&sender)?;

            // Adding metrics into metrics map
            <Metrics<T>>::insert(&sender, metrics_value);

            // Triggering metrics update event
            Self::deposit_event(RawEvent::MetricsUpdated(sender, metrics_value));

            Ok(())
        }
	}
}

decl_event!(
	pub enum Event<T> where AccountId = <T as system::Trait>::AccountId {
		// Metics updated event
		MetricsUpdated(AccountId, u32),
		// Master changed event
        NewMaster(AccountId),
	}
);

impl<T: Trait> Module<T> {
    // Adding account
    fn add_account(account: &T::AccountId) -> DispatchResult {
        // Checking if account exists already in storage
        if !<AccountsIndex<T>>::exists(account) {

            let accounts_count = Self::get_accounts_count();

            // Incrementing accounts count and preventing overflow
            let new_accounts_count = accounts_count.checked_add(1)
            .ok_or("Overflow adding new node.")?;

            // Adding account to account storage
            <Accounts<T>>::insert(accounts_count, account);
            <AccountsCount>::put(new_accounts_count);
            <AccountsIndex<T>>::insert(account, accounts_count);

        }
        Ok(())
    }
}

/// tests for this module
#[cfg(test)]
mod tests {
	use super::*;

	use sp_core::H256;
	use frame_support::{impl_outer_origin, assert_ok, assert_noop, parameter_types, weights::Weight};
	use sp_runtime::{
		traits::{BlakeTwo256, IdentityLookup}, testing::Header, Perbill,
	};

	impl_outer_origin! {
		pub enum Origin for Test {}
	}

	// For testing the module, we construct most of a mock runtime. This means
	// first constructing a configuration type (`Test`) which `impl`s each of the
	// configuration traits of modules we want to use.
	#[derive(Clone, Eq, PartialEq)]
	pub struct Test;
	parameter_types! {
		pub const BlockHashCount: u64 = 250;
		pub const MaximumBlockWeight: Weight = 1024;
		pub const MaximumBlockLength: u32 = 2 * 1024;
		pub const AvailableBlockRatio: Perbill = Perbill::from_percent(75);
	}
	impl system::Trait for Test {
		type Origin = Origin;
		type Call = ();
		type Index = u64;
		type BlockNumber = u64;
		type Hash = H256;
		type Hashing = BlakeTwo256;
		type AccountId = u64;
		type Lookup = IdentityLookup<Self::AccountId>;
		type Header = Header;
		type Event = ();
		type BlockHashCount = BlockHashCount;
		type MaximumBlockWeight = MaximumBlockWeight;
		type MaximumBlockLength = MaximumBlockLength;
		type AvailableBlockRatio = AvailableBlockRatio;
		type Version = ();
		type ModuleToIndex = ();
	}
	impl Trait for Test {
		type Event = ();
	}
	type ArchipelModule = Module<Test>;

	// This function basically just builds a genesis storage key/value store according to
	// our desired mockup.
	fn new_test_ext() -> sp_io::TestExternalities {
		system::GenesisConfig::default().build_storage::<Test>().unwrap().into()
	}

    #[test]
    fn set_master_should_work() {
        new_test_ext().execute_with(|| {
            // set master
            assert_ok!(ArchipelModule::set_master(Origin::signed(10), 0));

            // check if master was correctly set
            assert_eq!(ArchipelModule::get_master(), Some(10));
        })
    }

    #[test]
    fn wrong_old_master_should_fail() {
        new_test_ext().execute_with(|| {
            // set master
            assert_ok!(ArchipelModule::set_master(Origin::signed(10), 0));

            // wrong old master
            assert_noop!(
                ArchipelModule::set_master(Origin::signed(10), 0),
                "Incorrect old master report"
            );
        })
    }

    #[test]
    fn me_old_master_should_fail() {
        new_test_ext().execute_with(|| {
            // set master
            assert_ok!(ArchipelModule::set_master(Origin::signed(10), 0));

            // the same old master
            assert_noop!(
                ArchipelModule::set_master(Origin::signed(10), 10),
                "You are already master"
            );
        })
    }

    #[test]
    fn change_master_should_work() {
        new_test_ext().execute_with(|| {
            // set master
            assert_ok!(ArchipelModule::set_master(Origin::signed(10), 0));

            // change master
            assert_ok!(ArchipelModule::set_master(Origin::signed(20), 10));

            // check if master was correctly changed
            assert_eq!(ArchipelModule::get_master(), Some(20));
        })
    }

    #[test]
    fn add_metrics_should_work() {
        new_test_ext().execute_with(|| {
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
        new_test_ext().execute_with(|| {
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
}
