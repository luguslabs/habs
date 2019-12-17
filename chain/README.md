# archipel-chain
Archipel Substrate Chain. The goal of this chain is to synchronize Archipel orchestrators.

## To build and run dev Archipel Substrate Chain
>
> ```
> ./scripts/init.sh
> ./scripts/build.sh
> cargo build --release
> ./target/release/archipel --dev
> ```

## Purge dev chain
>
> ```
> ./target/release/archipel purge-chain --dev
> ```