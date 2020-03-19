# Archipel
![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![Website archipel.id](https://img.shields.io/badge/Website-archipel.id-brightgreen.svg)](https://archipel.id/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Twitter Follow](https://img.shields.io/twitter/follow/luguslabs.svg?style=social&label=Follow)](https://twitter.com/luguslabs)

Welcome to **Archipel** monorepository!

## What is Archipel ?
Archipel is a high availability solution for blockchain services. 

## Services Supported
* Polkadot Validator Node

## Why Archipel ?
Nowadays, many blockchain services are centralized on cloud infrastructure. For instance, around [70% of Ethereum nodes are in VPC](https://twitter.com/DAppNode/status/1108693643320270848?s=20) and 63% of Ethereum Dapps use Infura Provider as [this survey](https://medium.com/fluence-network/dapp-survey-results-2019-a04373db6452) shows. We can imagine that in a few years some of blockchain services can be banned from public cloud providers. Moreover, cloud providers can have interruption of services and network issues.

The solution is to have a decentralized infrastructure at home. The problem is that it is challenging to maintain a good quality of service at home. 
You can have internet connection or power cuts. As a result, it is very unsafe to install a Proof-of-Stake validator at home. Your validator must be always up (24/7) and ready to execute its duty. If not, you will be slashed by the network and lose your money.
To solve this problem, we are creating a solution to provide high availability for blockchain services. The first service that we target is Polkadot PoS Validator.

## How it works ?
The idea behind Archipel is federating some nodes between friends and family.
We are using [DAppNode](https://dappnode.io/) as the infrastructure layer for our solution. We want here to thanks DAppNode Teams for their amazing work and also supports for months now.
With DAppNode, you can launch a blockchain node (Bitcoin, Ethereum ...) or any P2P software.
To achieve the high availability of services, we are adding a service layer (Archipel) on top of it.

## Archipel Components
| Component | Description |
| --- | --- |
| [Chain](chain/) | Chain component is responsible for Archipel state synchronization between participants |
| [Orchestrator](orchestrator/) | Orchestrator is the decision-making component in Archipel federation |
| [CLI](cli/) | CLI is a component that generates configuration and bootstraps an Archipel federation |
| [UI](ui/) | UI is the Archipel chain state visualization component |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel |

## [Archipel Chain](https://github.com/luguslabs/archipel/tree/master/chain)
To federate several nodes and have a shared state to elect leader, we created a specific blockchain using Substrate framework. 

[Substrate](https://substrate.dev/) is a Parity framework that allows creating application-specific blockchains. 

We created a Substrate runtime that collects all nodes metrics and sets federation leader. This helps Archipel orchestrator to select the best leader appropriately in the federation. We call this specific blockchain the Archipel Substrate Chain or Archipel Chain. 

All nodes inside a federation, run Archipel Chain. In the current implementation, an Archipel must be composed of 3 nodes. That means that to operate, you have to set up 3 nodes. Try to set up nodes in different locations.

The idea is that in Archipel federation, all participants are trusted. They can be friends or family or other trusted social links. That allows us to have a fast chain consensus. 

## [Orchestrator](https://github.com/luguslabs/archipel/tree/master/orchestrator)

Orchestrator is the component that is responsible for decision making in an Archipel Federation.

### External services modes
* **Active mode** - the service will be launched in active mode only on the leader node
* **Passive mode** - the service will be launched in passive mode on all other non-leader nodes

### Archipel Orchestrator Workflow
- Launch external service in passive mode
- Send node metrics to Archipel Chain
- Retrieve other nodes metrics from Archipel Chain
- Retrieve current leader from Archipel Chain and determine its availability
- If the current leader is alive, do nothing and ensure that the service was launched in passive mode
- If the current leader is not alive, try to take its place by making a transaction to Archipel Chain
- If the transaction succeeded, the current node becomes the current leader of the federation
- Do supplementary checks (anyone other is alive, Archipel Chain Node has any peers...)
- If supplementary checks pass launch external service in active mode

### Archipel Orchestrator for HA Polkadot Validator Setup

The first service targeted by Archipel is Polkadot Validator. 

The Polkadot node can be launched in two modes:
* **Active mode** - Polkadot node in with validator option
* **Passive mode** - Polkadot node in the sync-only mode

We are also planning to support other services.

## [UI](https://github.com/luguslabs/archipel/tree/master/ui)

The Archipel UI visualizes the federation state.

It shows:
* the current leader elected 
* all federation nodes metrics

## [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel)

DAppNode package wrapping Archipel stack. 

It allows installing Archipel from the DAppNode interface in one click.

## Documentation
Please refer to the README instructions in the sub-repositories for more information on building, using, and testing each software component.

- [chain/README.md](chain/README.md)
- [orchestrator/README.md](orchestrator/README.md)
- [cli/README.md](cli/README.md)
- [deployer/README.md](deployer/README.md)
- [ui/README.md](ui/README.md)

Additional documentation
 - [Documentation](doc/README.md)

## Running with Docker
### Archipel Node 

It includes:
- Archipel Chain Node
- Archipel Orchestrator
- WireGuard VPN

```
# Create an .env file
cat <<EOF >.env
ARCHIPEL_NODE_ALIAS=archipel1
ARCHIPEL_KEY_SEED=mushroom ladder ...
ARCHIPEL_RESERVED_PEERS=
POLKADOT_NAME=test-name
POLKADOT_PREFIX=node-
SERVICE=polkadot
POLKADOT_IMAGE=parity/polkadot:latest
POLKADOT_KEY_GRAN=april shift ...
POLKADOT_KEY_BABE=region run ...
POLKADOT_KEY_IMON=screen sustain ...
POLKADOT_KEY_PARA=produce hover ...
POLKADOT_KEY_AUDI=oak tail ...
POLKADOT_LAUNCH_IN_VPN=true
ARCHIPEL_AUTHORITIES_SR25519_LIST=5FmqMTG...
ARCHIPEL_AUTHORITIES_ED25519_LIST=5FbQNUq...
# WireGuard config
WIREGUARD_PRIVATE_KEY=SJWzBT8....
WIREGUARD_ADDRESS=10.0.1.1/32
WIREGUARD_LISTEN_PORT=51820
WIREGUARD_PEERS_PUB_ADDR=9dcIYKj...,xg3wSS+...,gMjvfQGXWYJ...
WIREGUARD_PEERS_ALLOWED_IP=10.0.1.1/32,10.0.1.2/32,10.0.1.3/32
WIREGUARD_PEERS_EXTERNAL_ADDR=<public_ip>:51820,<public_ip>:51820,<public_ip>:51820
EOF

# Creating docker volumes
docker volume create archipel
docker volume create archipel_service

# Launch docker container
docker run -d --name "archipel" \
  --cap-add net_admin --cap-add sys_module \
  -p 51820:51820 \
  -v archipel:/root/chain/data \
  -v archipel_service:/service \
  --env-file .env \
  luguslabs/archipel:latest
```

### Archipel Node with Config File

Firstly you must generate a configuration file using [Archipel CLI](cli/).
The configuration file will include all necessary elements to bootstrap an Archipel federation.

```bash
# Creating docker volumes
docker volume create archipel
docker volume create archipel_service

# Launch docker container
docker run -d --name "archipel" \
  --cap-add net_admin --cap-add sys_module \
  -p 51820:51820 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v archipel:/root/chain/data \
  -v archipel_service:/service \
  -v ./archipel-config.zip:/config/archipel-config.zip \
  -e CONFIG_FILE='true' \
  -e NODE_ID=1 \
  luguslabs/archipel:latest
```

#### Example docker-compose.yml
```bash
version: '3.4'
services:
  archipel:
    image: luguslabs/archipel:latest
    volumes:
      - 'archipel:/root/chain/data'
      - 'archipel_service:/service'
      - '/var/run/docker.sock:/var/run/docker.sock'
      - './archipel-config.zip:/config/archipel-config.zip'
    ports:
      - '51820:51820/udp'
    privileged: true
    environment:
       CONFIG_FILE: 'true'
       NODE_ID: 1
       CONFIG_FILE_PASSWORD: ''
    restart: always

volumes:
  archipel:
  archipel_service:
```
* **Warning!** You must set your Node ID and CONFIG_FILE_PASSWORD.

### Environment Variables

#### Without config file

| Variable | Description | Values |
|----------|-------------|--------|
| `WIREGUARD_PRIVATE_KEY` | Wireguard private key. More details in [Archipel Wireguard Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/wireguard-keys-initialization.md) | String |
| `WIREGUARD_ADDRESS` | Wireguard address in the wireguard private network. More details in [Archipel Wireguard Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/wireguard-keys-initialization.md) | 10.0.1.n/32 |
| `WIREGUARD_LISTEN_PORT` | Port UDP of the private network. More details in [Archipel Wireguard Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/wireguard-keys-initialization.md) | 51820 |
| `WIREGUARD_PEERS_ALLOWED_IP` | all peers address in the private network separate by `,`. More details in [Archipel Wireguard Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/wireguard-keys-initialization.md) | 10.0.1.1/32,10.0.1.2/32,10.0.1.3/32 |
| `WIREGUARD_PEERS_EXTERNAL_ADDR` | all public IP address of peers separate by `,`. More details in [Archipel Wireguard Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/wireguard-keys-initialization.md) | PUBLIC_IP_1,PUBLIC_IP_2,PUBLIC_IP_3 |
| `ARCHIPEL_NODE_ALIAS` | Node name for the Archipel Substrate node within the federation. <br>Example<br> `Archipel-yourFederationName-NodeNameHere` | String |
| `ARCHIPEL_LISTEN_PORT` | Archipel Substrate listen port | 30334
| `ARCHIPEL_NODE_KEY_FILE` | Binary node key file name that must be present in container volume /config/ARCHIPEL_NODE_KEY_FILE. Value is used then with Substrate option `--node-key-file`. <br> Note that bin file is generate with [subkey generate-node-key] | String |
| `ARCHIPEL_KEY_SEED` |  | mnemonic |
| `ARCHIPEL_RESERVED_PEERS` | valorize `--reserved-nodes` substrate option. Note that archipel substrate is also launch with `--reserved-only` option.<br> Example :<br> `/ip4/WIREGUARD_ADDRESS_1/tcp/ARCHIPEL_LISTEN_PORT/p2p/NODE_PEER_ID_1,/ip4/WIREGUARD_ADDRESS_2/tcp/ARCHIPEL_LISTEN_PORT/p2p/NODE_PEER_ID_2,/ip4/WIREGUARD_ADDRESS_3/tcp/ARCHIPEL_LISTEN_PORT/p2p/NODE_PEER_ID_3` | String
| `ARCHIPEL_AUTHORITIES_SR25519_LIST` | Valorize the Genesis [Spec file](https://github.com/luguslabs/archipel/blob/master/deployer/test/chain/customSpec.json) for Archipel chain with the list of Authorities Public Keys in SR25519 format separated by \",\" char.<br> `<SR25519 Public Key Node 1>,<SR25519 Public Key Node 2>,<SR25519 Public Key Node 3>`|  Public Key, Public Key, Public Key
| `ARCHIPEL_AUTHORITIES_ED25519_LIST` | Valorize the Genesis [Spec file](https://github.com/luguslabs/archipel/blob/master/deployer/test/chain/customSpec.json) for Archipel chain with the list of Authorities Public Keys in ED25519 format separated by \",\" char.<br>`<ED25519 Public Key Node 1>,<ED25519 Public Key Node 2>,<ED25519 Public Key Node 3>`| Public Key, Public Key, Public Key
| `ARCHIPEL_TELEMETRY_URL` | Optional TELEMETRY_URL for Archipel substrate node. Example : `ws://BACKEND_PUBLIC_IP:8000/submit` | URL or `--no-telemetry` |
| `ARCHIPEL_SUSPEND_SERVICE` | If true the service node is never switch to active and remains passive. | boolean |
| `SERVICE` | External service you want to launch. Only support `polkadot` at the moment. | polkadot |
| `POLKADOT_NAME` | Node name for the polkadot node. Will be visible in [Polkadot telemetry URL](https://telemetry.polkadot.io/). This Node Name will a a -passive or -active suffix according to the current mode. <br>Example<br>`Archipel-yourFederationName-NodeNameHere` | String |
| `POLKADOT_IMAGE` | Polkadot docker image version to use. |  parity/polkadot:latest |
| `POLKADOT_PREFIX` | This prefix is used to mount the docker volume for blockchain state on the server. | String |
| `POLKADOT_KEY_GRAN` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator. <br>Gran keyType, Granpa ed25519.<br> Use for consensus.<br> [More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_BABE` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> Babe keyType, Babe sr25519. <br>Use for consensus/block production. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_IMON` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> IMON keyType, IamOnline key.<br> Use for heartbeat/block production. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_PARA` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> PARA keyType. sr25519. <br>Use for parachain production. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_AUDI` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> AUDI keyType. sr25519.<br> Use for Audit. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_NODE_KEY_FILE` | Binary node key file name that must be present in container volume `/config/POLKADOT_NODE_KEY_FILE`. <br> Will be then present in polkdaot container in folder `/polkadot/keys/`. <br> Value is used then with Polkadot option `--node-key-file`. <br> Note that bin file is generate with [subkey generate-node-key] | String |
| `POLKADOT_RESERVED_NODES` | valorize `--reserved-nodes` substrate option. <br> Note that polkadot is also launch with `--reserved-only` for validator ( active ) mode. <br> Example :<br> `/ip4/WIREGUARD_ADDRESS_1/tcp/30333/p2p/POLKADOT_NODE_PEER_ID_1,/ip4/WIREGUARD_ADDRESS_2/tcp/30333/p2p/POLKADOT_NODE_PEER_ID_2,/ip4/WIREGUARD_ADDRESS_3/tcp/30333/p2p/POLKADOT_NODE_PEER_ID_3` | String
| `POLKADOT_TELEMETRY_URL` | Optional TELEMETRY_URL for Polkadot Node. Example : `ws://BACKEND_PUBLIC_IP:8000/submit` | URL or `--no-telemetry` |
| `POLKADOT_LAUNCH_IN_VPN` | Use wireguard network for Polkadot | true |
| `POLKADOT_SIMULATE_SYNCH` | Use for testing purpuse to not wait Kusama to be synch to test active/passive switches| false 

#### With config file
| Variable | Description | Values |
|----------|-------------|--------|
| `CONFIG_FILE` |Try to load configuration from configuration archive or not. | boolean |
| `CONFIG_FILE_PASSWORD` |Configuration archive can be protected by a password. | string |
| `NODE_ID` |Every configuration archive contains configuration of multiple nodes.<br> You must select node number. | integer |

### Archipel UI
```bash
docker run -d -p 8080:80 luguslabs/archipel-ui
```
* The Archipel UI will be avaliable at http://localhost:8080
* Make sure that the 8080 port is available 

## Acknowledgements
<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The bootstrap development of Archipel is financed by [WEB3 Foundation](https://web3.foundation/)'s grant program [Wave4](https://medium.com/web3foundation/wrap-up-for-winter-with-our-wave-four-grant-recipients-52c27b831a6e). Thanks a lot for support.
