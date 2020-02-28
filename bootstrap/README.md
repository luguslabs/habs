# Archipel Bootstrap
Archipel Bootstrap is a component that generates configuration and bootstraps an Archipel federation.

## Prerequiste
- subkey tool installed :
```bash
rustup update nightly
rustup update stable
rustup target add wasm32-unknown-unknown --toolchain nightly
cargo install --force --git https://github.com/paritytech/substrate subkey
```
- zip

## Launch Bootstrap

### Run
```bash
yarn install
yarn run start
```

### Testing
```bash
yarn run test
```

## Build with Docker
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./bootstrap
docker build -t luguslabs/archipel-bootstrap .
```

## Note 

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
