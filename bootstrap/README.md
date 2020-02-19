# Archipel Bootstrap
Archipel Bootstrap is a component that generates configuration and bootstraps an Archipel federation.

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
