use crate::{RawEvent, mock::*};
use frame_support::{assert_ok, assert_noop};

#[test]
fn set_leader_should_work() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// check if leader was correctly set in group 1
		assert_eq!(ArchipelModule::get_leader(1), 10);
	})
}

#[test] 
fn wrong_old_leader_should_fail() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// wrong old leader
		assert_noop!(
			ArchipelModule::set_leader(Origin::signed(10), 0, 1),
			"Incorrect old leader report."
		);
	})
}

#[test]
fn me_old_leader_should_fail() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// the same old leader
		assert_noop!(
			ArchipelModule::set_leader(Origin::signed(10), 10, 1),
			"You are already leader."
		);
	})
}

#[test]
fn change_leader_should_work() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// change leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(20), 10, 1));

		// check if leader was correctly changed
		assert_eq!(ArchipelModule::get_leader(1), 20);
	})
}

#[test]
fn add_heartbeat_should_work() {
	ExtBuilder::build().execute_with(|| {
		// add heartbeat
		assert_ok!(ArchipelModule::add_heartbeat(Origin::signed(10), 1, 2));

		// checking if account was successfully added to structures
		assert_eq!(ArchipelModule::get_accounts_count(), 1);
		assert_eq!(ArchipelModule::get_accounts_index(10), 0);
		assert_eq!(ArchipelModule::get_account(0), 10);

		// check user group
		assert_eq!(ArchipelModule::get_group(10), 1);

		// check node status 
		assert_eq!(ArchipelModule::get_node_status(10), 2);

		// check heartbeats blockNumber
		assert_eq!(ArchipelModule::get_heartbeat(10), 42);

	})
}

#[test]
fn update_heartbeat_should_work() {
	ExtBuilder::build().execute_with(|| {
		// set heartbeat 1
		assert_ok!(ArchipelModule::add_heartbeat(Origin::signed(10), 1, 2));

		// check heartbeats blockNumber
		assert_eq!(ArchipelModule::get_heartbeat(10), 42);

		// check user group
		assert_eq!(ArchipelModule::get_group(10), 1);

		// check node status 
		assert_eq!(ArchipelModule::get_node_status(10), 2);

		System::set_block_number(43);

		// set heartbeat 2
		assert_ok!(ArchipelModule::add_heartbeat(Origin::signed(10), 3, 4));

		// checking if account structure was not altered
		assert_eq!(ArchipelModule::get_accounts_count(), 1);
		assert_eq!(ArchipelModule::get_accounts_index(10), 0);
		assert_eq!(ArchipelModule::get_account(0), 10);

		// checking updated heartbeat
		assert_eq!(ArchipelModule::get_heartbeat(10), 43);

		// check user group
		assert_eq!(ArchipelModule::get_group(10), 3);

		// check node status 
		assert_eq!(ArchipelModule::get_node_status(10), 4);
	})
}

#[test]
fn give_up_leadership_should_work() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// check if leader was correctly set in group 1
		assert_eq!(ArchipelModule::get_leader(1), 10);

		// give_up_leadership 
		assert_ok!(ArchipelModule::give_up_leadership(Origin::signed(10), 1));
	})
}

#[test]
fn give_up_leadership_on_wrong_group_should_fail() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// check if leader was correctly set in group 1
		assert_eq!(ArchipelModule::get_leader(1), 10);

		// wrong group leader
		assert_noop!(
			ArchipelModule::give_up_leadership(Origin::signed(10), 2),
			"No Leader in this group."
		);
	})
}

#[test]
fn give_up_leadership_if_not_leader_should_fail() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// check if leader was correctly set in group 1
		assert_eq!(ArchipelModule::get_leader(1), 10);

		// wrong group leader
		assert_noop!(
			ArchipelModule::give_up_leadership(Origin::signed(20), 1),
			"You are not the current leader."
		);
	})
}

#[test]
fn set_leader_event_should_work() {
	ExtBuilder::build().execute_with(|| {
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// construct event that should be emitted in the method call directly above
		let expected_event = TestEvent::generic_event(RawEvent::NewLeader(10,1));

		// iterate through array of `EventRecord`s
		assert!(System::events().iter().any(|a| a.event == expected_event));
	})
}

#[test]
fn set_earthbeat_event_should_work() {
	ExtBuilder::build().execute_with(|| {

		// Add heartbeat
		assert_ok!(ArchipelModule::add_heartbeat(Origin::signed(10), 1, 2));

		// construct event that should be emitted in the method call directly above
		// blockNumber is set to 42 in test
		let expected_event = TestEvent::generic_event(RawEvent::NewHeartbeat(10, 1, 2, 42));

		// iterate through array of `EventRecord`s
		assert!(System::events().iter().any(|a| a.event == expected_event));
	})
}

#[test]
fn give_up_leadership_event_should_work() {
	ExtBuilder::build().execute_with(|| {
	
		// set leader
		assert_ok!(ArchipelModule::set_leader(Origin::signed(10), 0, 1));

		// check if leader was correctly set in group 1
		assert_eq!(ArchipelModule::get_leader(1), 10);

		// give_up_leadership 
		assert_ok!(ArchipelModule::give_up_leadership(Origin::signed(10), 1));
		
		// construct event that should be emitted in the method call directly above
		let expected_event = TestEvent::generic_event(RawEvent::GiveUpLeader(10,1));

		// iterate through array of `EventRecord`s
		assert!(System::events().iter().any(|a| a.event == expected_event));
	})
}