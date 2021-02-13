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

- **service** - you need to provide service name to Archipel CLI. For now only `polkadot` service is supported.

**Example**

```bash
> archipel-cli init polkadot
....
Welcome to Archipel CLI!
Success! Config file for service 'polkadot' was initialized!
```

### Archipel.json

```bash
{
  "name": "Archipel Name",
  "publicIps": "1.1.1.1,2.2.2.2,3.3.3.3",
  "service": "polkadot",
  "granKey": "",
  "babeKey": "",
  "imonKey": "",
  "paraKey": "",
  "asgnKey": "",
  "audiKey": ""
}
```

- **name** - Archipel Name
- **publicIps** - A list of public IPs of 3 hosts where Archipel Nodes will be launched.
- **service** - Service that will run in Archipel Federation. **For now only `polkadot` service is supported.**
- **granKey** - Mnemonic of gran key for Polkadot validator node. Example: `april shift pupil quit mandate school cost oven gospel castle brain student`
- **babeKey** - Mnemonic of babe key for Polkadot validator node.
- **imonKey** - Mnemonic of imon key for Polkadot validator node.
- **paraKey** - Mnemonic of para key for Polkadot validator node.
- **asgnKey** - Mnemonic of asgn key for Polkadot validator node.
- **audiKey** - Mnemonic of audi key for Polkadot validator node.

To generate Polkadot keys use following tutorial [Polkadot Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/polkadot-keys-initialization.md).

### Generate

Reads archipel.json file and then generates Archipel Federation bootstrap archive (config.zip).

```bash
archipel-cli generate
```

**Example**

```bash
> archipel-cli generate
...
Welcome to Archipel CLI!
Generating init config file...
? Choose a password to protect Archipel archive: [hidden]
Success! Archipel configuration archive was generated!
```

- You must provide a password to encrypt configuration archive file.
- After execution of `archipel-cli generate` a `config.zip` file will be created. This archive file will include all necessary files and configurations to bootstrap your Archipel federation.
- You must pass this file securely to all participants of Archipel federation.

## Note

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
