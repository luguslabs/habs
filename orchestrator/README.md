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
SUSPEND_SERVICE=false
NODES_WALLETS='5FLaEvGea8M8qExr3owNQ...,5ETsP7Fd8wVVkHLM...,5HHW1oLjpJ3jrD86EG8PWw1peWWFbz...'
ARCHIPEL_NAME='archipel-test'

# Polkadot Validator Variables
POLKADOT_NAME='validator1'
POLKADOT_IMAGE='parity/polkadot:latest'
POLKADOT_PREFIX='node1-'
POLKADOT_KEY_GRAN='april shift pupil quit ...'
POLKADOT_KEY_BABE='region run sunset rule ...'
POLKADOT_KEY_IMON='screen sustain clog husband ...'
POLKADOT_KEY_PARA='produce hover hurdle lobster ...'
POLKADOT_KEY_AUDI='oak tail stomach fluid ...'
POLKADOT_RESERVED_NODES="/ip4/$POLKADOT_NODE1_IP/tcp/30333/p2p/$NODE1_POLKADOT_LOCAL_ID,/ip4/$POLKADOT_NODE2_IP/tcp/30333/p2p/$NODE2_POLKADOT_LOCAL_ID,/ip4/$POLKADOT_NODE3_IP/tcp/30333/p2p/$NODE3_POLKADOT_LOCAL_ID"
POLKADOT_TELEMETRY_URL=""
POLKADOT_NODE_KEY_FILE="key1-polkadot-node-key-file"
POLKADOT_ADDITIONAL_OPTIONS="--chain kusama --db-cache 512"
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

## API

| Path                   | Method | Description                                                                                                                                                                  | Example                                                          |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| /                      | GET    | Get realtime Archipel orchestrator info                                                                                                                                      | curl -s http://172.28.42.2:3000                                  |
| /metrics/disable       | GET    | Disable metrics send to Archipel chain                                                                                                                                       | curl -s http://172.28.42.2:3000/metrics/disable                  |
| /metrics/enable        | GET    | Enable metrics send to Archipel chain                                                                                                                                        | curl -s http://172.28.42.2:3000/metrics/disable                  |
| /orchestration/disable | GET    | Disable orchestration process <br> **WARNING! RISK!** Service container will remain in the same state all the time!                                                          | curl -s http://172.28.42.2:3000/orchestration/disable            |
| /orchestration/enable  | GET    | Enable orchestration process                                                                                                                                                 | curl -s http://172.28.42.2:3000/orchestration/enable             |
| /service/stop          | GET    | Stop and remove service container                                                                                                                                            | curl -s http://172.28.42.2:3000/service/stop                     |
| /service/start         | POST   | Start service container in specific mode. <br> **Fields:** - mode ('active' or 'passive') <br> **Warning!** The service will be relaunched by orchestrator if it is enabled. | curl --data "mode=passive" http://172.28.42.2:3000/service/start |

- **Warning!** Don't expose Archipel Orchestrator API publicly! There is no authentication!

## Note

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```
