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

- `add_metrics(origin, metrics_value: u32)` - function that allows every node in Archipel federation report its metrics. The metrics report also plays the role of a heartbeat transaction that allows checking node liveness. If a node has not reported its metrics for a certain period, it can be considered as down. If the federation leader is down, the Archipel Orchestrator will react, and a new leader will be elected.
    - `metrics_value` - parameter is not used by Archipel orchestrator at the moment. In the future, metrics will be used to enable a more accurate and fine-tuned leader election mechanism. 

- `set_leader(origin, old_leader: T::AccountId)` - function that is used in the case when the algorithm in the Archipel Orchestrator detects that the federation leader is down. Before starting service in active mode, Archipel Orchestrator must assure that it can take leadership, and everybody is aware of its decision. In this case, `set_leader` transaction is propagated by the Archipel Orchestrator. If this transaction succeeds, the orchestrator can be sure that everybody is aware that it takes leadership in the federation. It guarantees that nobody else will launch the service in active mode. So the orchestrator can safely launch service in active mode. 
    - `old_leader` - the current leader that is known and considered down by current orchestrator. The use of `old_leader` parameter assures that there are no two orchestrators that can take the leadership at the same time.
    - this function is also be called by orchestrators when the leader's place is free. The first orchestrator that will succeed the transaction will be the leader in Archipel federation.

## References
* [Based on Substrate Node Template](https://github.com/substrate-developer-hub/substrate-node-template/commit/9e02251a9c5d4b40c5b2df05f057437c534a7a18)
