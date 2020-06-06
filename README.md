# Archipel

![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![Website archipel.id](https://img.shields.io/badge/Website-archipel.id-brightgreen.svg)](https://archipel.id/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Twitter Follow](https://img.shields.io/twitter/follow/luguslabs.svg?style=social&label=Follow)](https://twitter.com/luguslabs)

Welcome to **Archipel** monorepository!

## What is Archipel ?

Archipel is a high availability solution for blockchain services.

## Services Supported

- Polkadot Validator Node

## Why Archipel ?

Nowadays, many blockchain services are centralized on cloud infrastructure. For instance, around [70% of Ethereum nodes are in VPC](https://twitter.com/DAppNode/status/1108693643320270848?s=20) and 63% of Ethereum Dapps use Infura Provider as [this survey](https://medium.com/fluence-network/dapp-survey-results-2019-a04373db6452) shows. We can imagine that in a few years some of blockchain services can be banned from public cloud providers.

The solution is to have a decentralized infrastructure at home. The problem is that it is challenging to maintain a good quality of service at home.
You can have internet connection or power cuts. As a result, it is very unsafe to install a Proof-of-Stake validator at home. Your validator must be always up (24/7) and ready to execute its duty. If not, you will be slashed by the network and lose your money.
To solve this problem, we are creating a solution to provide high availability for blockchain services. The first service that we target is Polkadot PoS Validator.

## How it works ?

The idea behind Archipel is federating some nodes between friends and family.
We are using [DAppNode](https://dappnode.io/) as the infrastructure layer for our solution.
With DAppNode, you can launch a blockchain node (Bitcoin, Ethereum ...) or any P2P software.
We would like to thank DAppNode Team for their amazing work.
To achieve the high availability of services at a DAppNode, we are adding Archipel on top of it.

## Archipel Components

| Component                                                                | Description                                                                            |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [Chain](chain/)                                                          | Chain component is responsible for Archipel state synchronization between participants |
| [Orchestrator](orchestrator/)                                            | Orchestrator is the decision-making component in Archipel federation                   |
| [CLI](cli/)                                                              | CLI is a component that generates configuration and bootstraps an Archipel federation  |
| [UI](ui/)                                                                | UI is the Archipel chain state visualization component                                 |
| [Deployer](deployer/)                                                    | Archipel End-To-End tests, build scripts and deploy tools                              |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel                                                     |

Please refer to the README instructions in the sub-repositories for more information on building, using, and testing each software component.

## [Archipel Chain](chain/)

To federate several nodes and have a shared state to elect a leader, we created a specific blockchain using the Substrate framework.

[Substrate](https://substrate.dev/) is a Parity framework that allows creating application-specific blockchains.

We created a Substrate runtime that collects all nodes metrics and sets federation leadership. This helps Archipel orchestrator to select the best leader appropriately in the federation. We call this specific blockchain the Archipel Substrate Chain or Archipel Chain.

All nodes inside a federation, run Archipel Chain. In the current implementation, an Archipel must be composed of at least 3 nodes. That means that to operate, you have to set up at least 3 nodes. Try to set up nodes in different locations.

The idea is that in the Archipel federation, all participants are trusted. They can be friends or family or other trusted social links. That allows us to have a fast chain consensus.

More information on [chain/README.md](chain/README.md)

## [Archipel Orchestrator](orchestrator/)

Orchestrator is the component that is responsible for decision making in an Archipel Federation.

### External services modes

Archipel federation support only 3 nodes or 6 nodes.

- **Operator Role** - the service will be launched in active mode if the node is elected or in passive mode in the others cases.
- **Sentry Role** - the service will be launched in sentry mode and protect active and passive nodes from public exposition.
  In 3 nodes federation, all 3 nodes are operator. Passive nodes act as sentry nodes for the current validator on a 3 nodes federation.
  That means that at some point a validator node can be exposed if passive (sentry). To have a more secure setup use the 6 nodes federation config.
  In 6 nodes federation, sentry nodes never because passive and active nodes. And passive and active nods never become sentry nodes during the HA orchestration.

#### 3 nodes federation roles

All 3 nodes are operator.
| Node | Role |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| archipel-node-1-{active or passive} | operator |
| archipel-node-2-{active or passive} | operator |
| archipel-node-3-{active or passive} | operator |

You must have the 3 operator nodes running to operate.

#### 6 nodes federation roles

3 nodes (1,2,3) are operator. 3 nodes ( 4,5,6) are sentry.
| Node | Role |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| archipel-node-1-{active or passive} | operator |
| archipel-node-2-{active or passive} | operator |
| archipel-node-3-{active or passive} | operator |
| archipel-node-4 | sentry |
| archipel-node-5 | sentry |
| archipel-node-6 | sentry |

You must have the 3 operator nodes running to operate and at least one sentry node up. 2 sentry nodes up is better. 3 sentry nodes up is safer.

### Archipel Orchestrator Workflow

- Launch external service in passive mode or sentry node according to node role
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

The Polkadot node can be launched :

#### 3 nodes federation

- **Active mode** - Polkadot node in with validator option
- **Sentry-Passive mode** - Polkadot node in the sentry mode for the current validator

#### 6 nodes federation

- **Active mode** - Polkadot node in with validator option
- **Passive mode** - Polkadot node in the sync-only mode and with reserved peers only
- **Sentry mode** - Polkadot node in the sentry mode for passive and active others nodes.

We are also planning to support other services.

More information on [orchestrator/README.md](orchestrator/README.md)

## [Archipel CLI](cli/)

Archipel CLI is a component that generates configuration and bootstraps an Archipel federation.

More information on [cli/README.md](cli/README.md)

## [Archipel UI](ui/)

The Archipel UI to administrate and visualize the federation state :

<p align="center">
 <img src=doc/images/archipel-ui-page.png width = 600>
</p>

More information on [ui/README.md](ui/README.md)

## [Archipel Deployer](deployer/)

Archipel End-To-End tests, build scripts and deploy tools.

More information on [deployer/README.md](deployer/README.md)

## [Archipel DAppNode Package](https://github.com/luguslabs/DAppNodePackage-archipel)

DAppNode package wrapping Archipel stack.

It allows installing Archipel from the DAppNode interface in one click.

More information on [DAppNodePackage-archipel/README.md](https://github.com/luguslabs/DAppNodePackage-archipel/README.md)

## [Additional Documentation Resources](doc/README.md)

### Keys Initialization doc

- [Archipel Keys Initialization](doc/archipel-keys-initialization.md)
- [Archipel Wireguard Keys Initialization](doc/wireguard-keys-initialization.md)
- [Polkadot Keys Initialization](doc/polkadot-keys-initialization.md)

### Testing doc

- [Archipel Federation Testing](doc/archipel-federation-testing.md)
- [Archipel Test Results](doc/archipel-test-results.md)

### Deployment doc

- [Archipel Deployment On DAppNodes](doc/deployment-on-dappnodes.md)
- [Archipel Deployment With Docker](doc/deployment-with-docker.md)

## Acknowledgements

<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The bootstrap development of Archipel is financed by [WEB3 Foundation](https://web3.foundation/)'s grant program [Wave4](https://medium.com/web3foundation/wrap-up-for-winter-with-our-wave-four-grant-recipients-52c27b831a6e). Thanks a lot for support.
