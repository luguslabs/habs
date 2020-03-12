# Archipel CLI
Archipel CLI is a component that generates configuration and bootstraps an Archipel federation.

## Launch CLI

### Run
```bash
yarn install
yarn start
```

### Use with Docker
```bash
# BASH
echo 'alias archipel-cli='"'"'docker run --interactive --tty --rm -v $(pwd):/archipel-cli -w /archipel-cli luguslabs/archipel-cli:latest'"'"'' >> ~/.bash_aliases && source ~/.bashrc
# ZSH
echo 'alias archipel-cli='"'"'docker run --interactive --tty --rm -v $(pwd):/archipel-cli -w /archipel-cli luguslabs/archipel-cli:latest'"'"'' >> ~/.zshrc && source ~/.zshrc
```

### Install
```bash
git clone https://github.com/luguslabs/archipel.git
cd ./cli
npm install -g .
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

## Use

### Init
Initializes a template of configuration file in archipel.json.
```bash
archipel-cli init <service>
```
* **service** - you need to provide service name to Archipel CLI. For now only `polkadot` service is supported.

### Generate
Reads archipel.json file and then generates Archipel Federation bootstrap archive (config.zip).
```bash
archipel-cli generate
```

## Note 

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
