# Archipel Orchestrator
Archipel Orchestrator is the decision making component in Archipel federation.
It stops, starts, activates or deactivates the validator node according to the Archipel Chain state.

## Launch Orchestrator

### Create .env file
```bash
# .env
NODE_ENV='development'
DEBUG='app,chain,docker,metrics,polkadot,service'

# Setting Archipel Variables
NODE_WS='ws://127.0.0.1:9944'
MNEMONIC='mushroom ladder...'
ALIVE_TIME=60000
SERVICE='polkadot'

# Polkadot Validator Variables
POLKADOT_NAME='validator1'
POLKADOT_IMAGE='parity/polkadot:latest'
POLKADOT_PREFIX='node1-'
POLKADOT_KEY_GRAN='april shift pupil quit ...'
POLKADOT_KEY_BABE='region run sunset rule ...'
POLKADOT_KEY_IMON='screen sustain clog husband ...'
POLKADOT_KEY_PARA='produce hover hurdle lobster ...'
POLKADOT_KEY_AUDI='oak tail stomach fluid ...'

```

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
cd ./orchestrator
docker build -t luguslabs/archipel-orchestrator .
```

## Note 

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
