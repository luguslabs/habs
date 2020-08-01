/* eslint-disable */

const { Metrics } = require('../metrics');

test('Test metrics addition', () => {
  const metrics = new Metrics();
  metrics.addMetrics('wallet1', 42, 1500);
  expect(metrics.getMetrics('wallet1')).toStrictEqual({ metrics: 42, name: '', blockNumber: 1500 });
});

test('Test anyone is alive no wallets', () => {
  const metrics = new Metrics();

  expect(metrics.anyOneAlive('wallet1', 10, 20)).toBe(false);
});

test('Test anyone is alive only my wallet', () => {
  const nowTime = new Date().getTime();
  const metrics = new Metrics();

  metrics.addMetrics('wallet1', 42, 10);

  expect(metrics.anyOneAlive('wallet1', 10, 20)).toBe(false);

});

test('Test anyone is alive two wallets', () => {
  const nowTime = new Date().getTime();
  const metrics = new Metrics();

  metrics.addMetrics('wallet1', 42, 10);
  metrics.addMetrics('wallet2', 42, 10);

  expect(metrics.anyOneAlive('wallet1', 10, 15 )).toBe(true);
  expect(metrics.anyOneAlive('wallet1', 10, 20)).toBe(false);
});
