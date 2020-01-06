# Archipel Chain
Archipel Chain based on Substrate framework. The goal of this chain is to synchronize Archipel orchestrators.

## To build and run dev Archipel Substrate Chain
```
./scripts/init.sh
./scripts/build.sh
cargo build --release
./target/release/archipel --dev
```

## Purge dev chain
```
./target/release/archipel purge-chain --dev
```

## Test Archipel Runtime
```
cargo test -p archipel-runtime
```