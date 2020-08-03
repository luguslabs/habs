/* eslint-disable */

const { Heartbeats } = require('../heartbeats');

test('Test heartbeats addition', () => {
  const heartbeats = new Heartbeats();
  heartbeats.addHeartbeat('wallet1', 42, 1, 1500);
  expect(heartbeats.getHeartbeat('wallet1')).toStrictEqual({ group: 42, name: '', nodeStatus:1, blockNumber: 1500 });
});

test('Test anyone is alive no wallets', () => {
  const heartbeats = new Heartbeats();

  expect(heartbeats.anyOneAlive('wallet1', 10, 1, 20)).toBe(false);
});

test('Test anyone is alive only my wallet', () => {
  const heartbeats = new Heartbeats();

  heartbeats.addHeartbeat('wallet1', 42, 1, 10);

  expect(heartbeats.anyOneAlive('wallet1', 10, 42, 20)).toBe(false);

});

test('Test anyone is alive two wallets', () => {
  const heartbeats = new Heartbeats();

  heartbeats.addHeartbeat('wallet1', 42, 1, 10);
  heartbeats.addHeartbeat('wallet2', 42, 2, 10);

  expect(heartbeats.anyOneAlive('wallet1', 10, 42, 15 )).toBe(true);
  expect(heartbeats.anyOneAlive('wallet1', 10, 42, 20)).toBe(false);
});


test('Test anyone is alive. Other wallet in other group', () => {
  const heartbeats = new Heartbeats();

  heartbeats.addHeartbeat('wallet1', 42, 1, 10);
  heartbeats.addHeartbeat('wallet2', 43, 2, 10);

  expect(heartbeats.anyOneAlive('wallet1', 10, 42, 15 )).toBe(false);
});
