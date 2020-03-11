# Archipel CLI
Archipel CLI is a component that generates configuration and bootstraps an Archipel federation.

## Launch CLI

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
cd ./cli
docker build -t luguslabs/archipel-cli .
```

## Note 

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
