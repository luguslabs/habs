# Archipel Chain

Archipel Chain based on Substrate framework. The goal of this chain is to synchronize Archipel orchestrators.

## Build

Install Rust:

```bash
curl https://sh.rustup.rs -sSf | sh
```

Initialize your Wasm Build environment:

```bash
./scripts/init.sh
```

Build Wasm and native code:

```bash
cargo build --release
```

## Build with Docker

```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./chain
docker build -t luguslabs/archipel-chain .
```

## Run

### Single node development chain

Purge any existing developer chain state:

```bash
./target/release/archipel purge-chain --dev
```

Start a development chain with:

```bash
./target/release/archipel --dev
```

Detailed logs may be shown by running the node with the following environment variables set: `RUST_LOG=debug RUST_BACKTRACE=1 cargo run -- --dev`.

## Test

### Archipel Runtime

```
cargo test -p archipel-runtime
```

## Archipel Runtime Functions

- `add_heartbeat(origin, group_id: u32, node_status: u32)` - function that allows every node in Archipel federation report its heartbeats. The heartbeats report also plays the role of a heartbeat transaction that allows checking node liveness. If a node has not reported its heartbeats for a certain period, it can be considered as down. If the federation leader is down, the Archipel Orchestrator will react, and a new leader will be elected.

  `group_id` - use to filter different archipel group nodes for different HA service

  `node_status` - node status information that can be used in archipel UI.

  Current mapping status:
  |status | int |
  |---------|-----|
  | active | 1 |
  | passive | 2 |
  | sentry | 3 |

- `set_leader(origin, old_leader: T::AccountId, group_id: u32)` - function that is used in the case when the algorithm in the Archipel Orchestrator detects that the federation leader is down. Before starting service in active mode, Archipel Orchestrator must assure that it can take leadership, and everybody is aware of its decision. In this case, `set_leader` transaction is propagated by the Archipel Orchestrator. If this transaction succeeds, the orchestrator can be sure that everybody is aware that it takes leadership in the federation. It guarantees that nobody else will launch the service in active mode. So the orchestrator can safely launch service in active mode.

  `old_leader` - the current leader that is known and considered down by current orchestrator. The use of `old_leader` parameter assures that there are no two orchestrators that can take the leadership at the same time.

  `set_leader` function is also be called by orchestrators when the leader's place is free. The first orchestrator that will succeed the transaction will be the leader in Archipel federation.

  `group_id` - use to filter different archipel group nodes for different HA service

- `give_up_leadership(origin, group_id: u32)`

This function is not yet used in the orchestrator program. It could be use in the future by admin to cancel a current leader for some reasons.
This function is used now in orchetratr E2E tests.

## References

- [Based on Substrate Node Template](https://github.com/substrate-developer-hub/substrate-node-template/releases/tag/v2.0.0-rc5)

# Archipel Chain

Archipel Chain based on Substrate framework. The goal of this chain is to synchronize Archipel orchestrators.

## Build

Install Rust:

```bash
curl https://sh.rustup.rs -sSf | sh
```

Initialize your Wasm Build environment:

```bash
./scripts/init.sh
```

Build Wasm and native code:

```bash
cargo build --release
```

## Build with Docker

```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./chain
docker build -t luguslabs/archipel-chain .
```

## Run

### Single node development chain

Purge any existing developer chain state:

```bash
./target/release/archipel purge-chain --dev
```

Start a development chain with:

```bash
./target/release/archipel --dev
```

Detailed logs may be shown by running the node with the following environment variables set: `RUST_LOG=debug RUST_BACKTRACE=1 cargo run -- --dev`.

## Test

### Archipel Runtime

```
cargo test -p archipel-runtime
```

## Archipel Runtime Functions

- `add_heartbeat(origin, group_id: u32, node_status: u32)` - function that allows every node in Archipel federation report its heartbeats. The heartbeats report also plays the role of a heartbeat transaction that allows checking node liveness. If a node has not reported its heartbeats for a certain period, it can be considered as down. If the federation leader is down, the Archipel Orchestrator will react, and a new leader will be elected.

  `group_id` - use to filter different archipel group nodes for different HA service

  `node_status` - node status information that can be used in archipel UI.

  Current mapping status:
  |status | int |
  |---------|-----|
  | active | 1 |
  | passive | 2 |
  | sentry | 3 |

- `set_leader(origin, old_leader: T::AccountId, group_id: u32)` - function that is used in the case when the algorithm in the Archipel Orchestrator detects that the federation leader is down. Before starting service in active mode, Archipel Orchestrator must assure that it can take leadership, and everybody is aware of its decision. In this case, `set_leader` transaction is propagated by the Archipel Orchestrator. If this transaction succeeds, the orchestrator can be sure that everybody is aware that it takes leadership in the federation. It guarantees that nobody else will launch the service in active mode. So the orchestrator can safely launch service in active mode.

  `old_leader` - the current leader that is known and considered down by current orchestrator. The use of `old_leader` parameter assures that there are no two orchestrators that can take the leadership at the same time.

  `set_leader` function is also be called by orchestrators when the leader's place is free. The first orchestrator that will succeed the transaction will be the leader in Archipel federation.

  `group_id` - use to filter different archipel group nodes for different HA service

- `give_up_leadership(origin, group_id: u32)`

This function is not yet used in the orchestrator program. It could be use in the future by admin to cancel a current leader for some reasons.
This function is used now in orchetratr E2E tests.

## References

- [Based on Substrate Node Template](https://github.com/substrate-developer-hub/substrate-node-template/releases/tag/v2.0.0-rc5)
