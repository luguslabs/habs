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

## References
* [Based on Substrate Node Template](https://github.com/substrate-developer-hub/substrate-node-template/commit/9e02251a9c5d4b40c5b2df05f057437c534a7a18)
