# Archipel Orchestrator
Archipel Orchestrator is the decision making component in Archipel federation.
It stops, starts, activates or deactivates the validator node according to the Archipel Chain state.

## Launch Orchestrator

### Create .env file
```bash
# .env
NODE_ENV=development

# Setting Archipel Variables
NODE_WS=ws://127.0.0.1:9944
MNEMONIC="mushroom ladder...."

# Polkadot Validator Variables
POLKADOT_NAME='validator_name'
POLKADOT_KEY='0x5e4b8a22......'
POLKADOT_IMAGE='chevdor/polkadot:0.4.4'
```

### Run
```bash
yarn install
yarn run start
```

## Note 

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
