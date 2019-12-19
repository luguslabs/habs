use support::{decl_event, dispatch::Result, StorageMap, StorageValue};
use support::{decl_module, decl_storage, ensure};
use system::ensure_signed;

pub trait Trait: balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as ArchipelStorage {
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

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
    {
        MetricsUpdated(AccountId, u32),
        NewMaster(AccountId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        // Enable events
        fn deposit_event<T>() = default;

        // Set master nodes
        fn set_master(origin, old_master: T::AccountId) -> Result {
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
        fn add_metrics(origin, metrics_value: u32) -> Result {
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

impl<T: Trait> Module<T> {
    // Adding account
    fn add_account(account: &T::AccountId) -> Result {
        // Checking if account exists already in storage
        if !<AccountsIndex<T>>::exists(account) {

            let accounts_count = Self::get_accounts_count();

            // Incrementing accounts count and preventing overflow
            let new_accounts_count = accounts_count.checked_add(1)
            .ok_or("Overflow adding new node.")?;

            // Adding account to account storage
            <Accounts<T>>::insert(accounts_count, account);
            <AccountsCount<T>>::put(new_accounts_count);
            <AccountsIndex<T>>::insert(account, accounts_count);

        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use primitives::{Blake2Hasher, H256};
    use runtime_io::{with_externalities, TestExternalities};
    use runtime_primitives::{
        testing::{Digest, DigestItem, Header},
        traits::{BlakeTwo256, IdentityLookup},
        BuildStorage,
    };
    use support::{assert_noop, assert_ok, impl_outer_origin};

    impl_outer_origin! {
        pub enum Origin for ArchipelTest {}
    }

    #[derive(Clone, Eq, PartialEq)]
    pub struct ArchipelTest;

    impl system::Trait for ArchipelTest {
        type Origin = Origin;
        type Index = u64;
        type BlockNumber = u64;
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type Digest = Digest;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = ();
        type Log = DigestItem;
    }

    impl balances::Trait for ArchipelTest {
        type Balance = u64;
        type OnFreeBalanceZero = ();
        type OnNewAccount = ();
        type Event = ();
        type TransactionPayment = ();
        type TransferPayment = ();
        type DustRemoval = ();
    }

    impl super::Trait for ArchipelTest {
        type Event = ();
    }

    type Archipel = super::Module<ArchipelTest>;

    fn build_ext() -> TestExternalities<Blake2Hasher> {
        let mut t = system::GenesisConfig::<ArchipelTest>::default()
            .build_storage()
            .unwrap()
            .0;
        t.extend(
            balances::GenesisConfig::<ArchipelTest>::default()
                .build_storage()
                .unwrap()
                .0,
        );
        t.into()
    }

    #[test]
    fn set_master_should_work() {
        with_externalities(&mut build_ext(), || {
            // set master
            assert_ok!(Archipel::set_master(Origin::signed(10), 0));

            // check if master was correctly set
            assert_eq!(Archipel::get_master(), Some(10));
        })
    }

    #[test]
    fn wrong_old_master_should_fail() {
        with_externalities(&mut build_ext(), || {
            // set master
            assert_ok!(Archipel::set_master(Origin::signed(10), 0));

            // wrong old master
            assert_noop!(
                Archipel::set_master(Origin::signed(10), 0),
                "Incorrect old master report"
            );
        })
    }

    #[test]
    fn me_old_master_should_fail() {
        with_externalities(&mut build_ext(), || {
            // set master
            assert_ok!(Archipel::set_master(Origin::signed(10), 0));

            // the same old master
            assert_noop!(
                Archipel::set_master(Origin::signed(10), 10),
                "You are already master"
            );
        })
    }

    #[test]
    fn change_master_should_work() {
        with_externalities(&mut build_ext(), || {
            // set master
            assert_ok!(Archipel::set_master(Origin::signed(10), 0));

            // change master
            assert_ok!(Archipel::set_master(Origin::signed(20), 10));

            // check if master was correctly changed
            assert_eq!(Archipel::get_master(), Some(20));
        })
    }

    #[test]
    fn add_metrics_should_work() {
        with_externalities(&mut build_ext(), || {
            // set metrics
            assert_ok!(Archipel::add_metrics(Origin::signed(10), 4242));

            // checking if account was successfully added to structures
            assert_eq!(Archipel::get_accounts_count(), 1);
            assert_eq!(Archipel::get_accounts_index(10), 0);
            assert_eq!(Archipel::get_account(0), 10);

            // check metrics
            assert_eq!(Archipel::get_metrics(10), 4242);

        })
    }
    #[test]
    fn update_metrics_should_work() {
        with_externalities(&mut build_ext(), || {
            // set metrics 1
            assert_ok!(Archipel::add_metrics(Origin::signed(10), 4242));

            // set metrics 2
            assert_ok!(Archipel::add_metrics(Origin::signed(10), 4243));

            // checking if account structure was not altered
            assert_eq!(Archipel::get_accounts_count(), 1);
            assert_eq!(Archipel::get_accounts_index(10), 0);
            assert_eq!(Archipel::get_account(0), 10);

            // checking updated metrics
            assert_eq!(Archipel::get_metrics(10), 4243);

        })
    }
}
