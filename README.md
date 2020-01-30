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
| [Orchestator](orchestrator/) | Orchestrator is the decision-making component in Archipel federation |
| [UI](ui/) | UI is the Archipel chain state visualization component |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel |

## [Archipel Chain](https://github.com/luguslabs/archipel/tree/master/chain)
To federate several nodes and have a shared state to elect leader, we created a specific blockchain using Substrate framework. 

[Substrate](https://substrate.dev/) is a Parity framework that allows creating application-specific blockchains. 

We created a Substrate runtime that collects all nodes metrics and sets federation leader. This helps Archipel orchestrator to select the best leader appropriately in the federation. We call this specific blockchain the Archipel Substrate Chain or Archipel Chain. 

All nodes inside a federation, run Archipel Chain. In the current implementation, an Archipel must be composed of 3 nodes. That means that to operate, you have to set up 3 nodes. Try to set up nodes in different locations using different ISPs.

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
Please refer to the README instructions in sub-repositories for building and using each software component:

- [chain/README.md](chain/README.md)
- [orchestrator/README.md](orchestrator/README.md)
- [deployer/README.md](deployer/README.md)
- [ui/README.md](ui/README.md)

Additional documentation
 - [Documentation](doc/README.md)

## Running with Docker
### Archipel (Validator Archipel Chain Node + Orchestrator)
```
# Create an .env file
cat <<EOF >.env
ARCHIPEL_NODE_ALIAS=archipel1
ARCHIPEL_KEY_SEED=mushroom ladder ...
ARCHIPEL_CHAIN_ADDITIONAL_PARAMS=
POLKADOT_NAME=test-name
POLKADOT_PREFIX=node-
SERVICE=polkadot
POLKADOT_IMAGE=parity/polkadot:latest
POLKADOT_KEY_GRAN=april shift ...
POLKADOT_KEY_BABE=region run ...
POLKADOT_KEY_IMON=screen sustain ...
POLKADOT_KEY_PARA=produce hover ...
POLKADOT_KEY_AUDI=oak tail ...
ARCHIPEL_AUTHORITIES_SR25519_LIST=5FmqMTG...
ARCHIPEL_AUTHORITIES_ED25519_LIST=5FbQNUq...
EOF

# Launch docker container
docker run -d --name "archipel1" \
  -p 30333:30333 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /root/chain/data \
  --env-file .env \
  luguslabs/archipel:latest
```

### Archipel Node (Non-Validator Archipel Chain Node)
```
# Create an .env file
cat <<EOF >.env
ARCHIPEL_AUTHORITIES_SR25519_LIST=5FmqMTG...
ARCHIPEL_AUTHORITIES_ED25519_LIST=5FbQNUq...
ARCHIPEL_NODE_ALIAS=archipel-node
ARCHIPEL_CHAIN_ADDITIONAL_PARAMS=
EOF

# Launch docker container
docker run -d --name "archipel-node" \
  -p 9944:9944 \
  -v /root/chain/data \
  --env-file .env \
  luguslabs/archipel-node:latest
```

### Environment Variables

| Variable | Description | Values |
|----------|-------------|--------|
| `ARCHIPEL_NODE_ALIAS` | Node name for the Archipel Substrate node within the federation. <br>Example<br> `Archipel-yourFederationName-NodeNameHere` | String |
| `ARCHIPEL_KEY_SEED` | 12 words mnemonic. <br> Can be generated with [Subkey](https://substrate.dev/docs/en/ecosystem/subkey). <br>Use for Archipel Substrate node. <br>Will be used for consensus authority and transactions propagation in the Archipel Chain. | mnemonic |
| `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` | Parameters supported by substrate node.<br> At least, you must valorize bootnodes. To valorize bootnodes you must start nodes first and then rebbot all your 3 nodes in the federation with bootnode list valorized thank to local node id find in logs. <br>Example :<br> `--bootnodes /ip4/$NODE1_IP/tcp/30333/p2p/$NODE1_LOCAL_ID --bootnodes /ip4/$NODE2_IP/tcp/30333/p2p/$NODE2_LOCAL_ID --bootnodes /ip4/$NODE3_IP/tcp/30333/p2p/$NODE3_LOCAL_ID` | String
| `ARCHIPEL_AUTHORITIES_SR25519_LIST` | Valorize the Genesis [Spec file](https://github.com/luguslabs/archipel/blob/master/deployer/test/chain/customSpec.json) for Archipel chain with the list of Authorities Public Keys in SR25519 format separated by \",\" char.<br> `<SR25519 Public Key Node 1>,<SR25519 Public Key Node 2>,<SR25519 Public Key Node 3>`|  Public Key, Public Key, Public Key
| `ARCHIPEL_AUTHORITIES_ED25519_LIST` | Valorize the Genesis [Spec file](https://github.com/luguslabs/archipel/blob/master/deployer/test/chain/customSpec.json) for Archipel chain with the list of Authorities Public Keys in ED25519 format separated by \",\" char.<br>`<ED25519 Public Key Node 1>,<ED25519 Public Key Node 2>,<ED25519 Public Key Node 3>`| Public Key, Public Key, Public Key
| `SERVICE` | External service you want to launch. Only support `polkadot` at the moment. | polkadot |
| `POLKADOT_NAME` | Node name for the polkadot node. Will be visible in [Polkadot telemetry](https://telemetry.polkadot.io/). This Node Name will a a -passive or -active suffix according to the current mode. <br>Example<br>`Archipel-yourFederationName-NodeNameHere` | String |
| `POLKADOT_IMAGE` | Polkadot docker image version to use. |  parity/polkadot:latest |
| `POLKADOT_PREFIX` | This prefix is used to mount the docker volume for blockchain state on the server. | String |
| `POLKADOT_KEY_GRAN` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator. <br>Gran keyType, Granpa ed25519.<br> Use for consensus.<br> [More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_BABE` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> Babe keyType, Babe sr25519. <br>Use for consensus/block production. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_IMON` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> IMON keyType, IamOnline key.<br> Use for heartbeat/block production. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_PARA` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> PARA keyType. sr25519. <br>Use for parachain production. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |
| `POLKADOT_KEY_AUDI` |12 words mnemonic. <br> Polkadot Sessions keys needed to operate as validator.<br> AUDI keyType. sr25519.<br> Use for Audit. <br>[More details for sessions keys](https://github.com/luguslabs/archipel/tree/master/orchestrator#polkadot-sessions-keys-explained)| mnemonic |

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
