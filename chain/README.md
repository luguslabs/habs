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

## Archipel Runtime
The Archipel Runtime has 2 fonctions that can be called by all the 3 archipel nodes of the federation :
- `set_leader(origin, old_leader: T::AccountId)`: 

When the algorithm in the orchestrator detect a leadership necessity to start. Before starting in active mode (aka validator mode), a `set_leader` transaction is propagated by the candidate node. In this `set_leader` call function, the candidate node must indicates parameter `old_leader` : the current node seen as bad or down leader from his point of view. The candidate node will only start his validator duty, if it sees his `set_leader` transaction finilized sucessflully.
This `set_leader` call, with 3 nodes in the archipel, allows to prevent 2 nodes to start validating in the same time. We will see if this simpe algorithm must be evolved to cover all equivocation. In the algorithm, we will prefere an archipel service down instead of [equivocation](https://guide.kusama.network/en/latest/try/secure-validator-setup/#high-availability) on the network and heavy slashes.
- `add_metrics(origin, metrics_value: u32)`: 

It is an heartbeat transaction that allow to detect node liveness and detect network or power crash of the current leader. If no transactions received `add_metrics` from an entities, the orchestrator will react. `metrics_value` parameter is not used at te moment. In the future, metrics details could be added and stored to have a more accurate state or leaders selection optmisations. 


Note : 

As all the project is dockerize, you can launch also 1, 2, or 3 Archipel chain containers into cloud providers but this not the end goal of the solution. You can find others system to garantee HA or failover in cloud. Here the goal is to setup an HA on decentralized infrastructures. For instance using DAppNode.


## References
* [Based on Substrate Node Template](https://github.com/substrate-developer-hub/substrate-node-template/commit/9e02251a9c5d4b40c5b2df05f057437c534a7a18)
