use crate::{RawEvent, mock::*};
use frame_support::{assert_ok, assert_noop};

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
fn set_leader_event_should_work() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0));

		// construct event that should be emitted in the method call directly above
		let expected_event = TestEvent::generic_event(RawEvent::NewLeader(10));

		// iterate through array of `EventRecord`s
		assert!(System::events().iter().any(|a| a.event == expected_event));
	})
}

#[test]
fn check_timestamp_update_metrics_event_should_work() {
	ExtBuilder::build().execute_with(|| {

		// Set metrics
		assert_ok!(ArchipelModule::add_metrics(Origin::signed(10), 65));

		// construct event that should be emitted in the method call directly above
		// blockNumbr is set to 1 in test
		let expected_event = TestEvent::generic_event(RawEvent::MetricsUpdated(10, 65, 1));

		// iterate through array of `EventRecord`s
		assert!(System::events().iter().any(|a| a.event == expected_event));
	})
}
