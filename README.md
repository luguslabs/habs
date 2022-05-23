# Archipel

![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![Website archipel.id](https://img.shields.io/badge/Website-archipel.id-brightgreen.svg)](https://archipel.id/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Twitter Follow](https://img.shields.io/twitter/follow/luguslabs.svg?style=social&label=Follow)](https://twitter.com/luguslabs)

Welcome to **Archipel** monorepository!

# Archipel Polkadot validators are Live!

Check blog post for more information : https://medium.com/luguslabs/archipel-polkadot-validators-are-live-eec9c76c32bb

And all previous blog posts at https://medium.com/luguslabs/

## What is Archipel ?

Archipel is a high availability solution for blockchain services.

## Services Supported

- Polkadot Node
- Kusama Node
- Centrifuge Node
- Trustlines Node

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

We created a Substrate runtime that collects all nodes heartbeats and sets federation leadership. This helps Archipel orchestrator to select the best leader appropriately in the federation. We call this specific blockchain the Archipel Substrate Chain or Archipel Chain.

All nodes inside a federation, run Archipel Chain. In the current implementation, an Archipel must be composed of at least 4 nodes. That means that to operate, you have to set up at least 4 nodes. Try to set up nodes in different locations.

The idea is that in the Archipel federation, all participants are trusted. They can be friends or family or other trusted social links. That allows us to have a fast chain consensus.

The Archipel chain, needed for orchestration state, uses [babe/grandpa consensus](https://wiki.polkadot.network/docs/en/learn-consensus#what-is-grandpababe) provided by the Substrate framework. To sum up, as soon as more than 2/3 of authorities attest to a chain containing a certain block, all blocks leading up to that one are finalized at once. When finalized, blockchains events are received by Archipel nodes. That means that this high-availability solution needs (⅔ nodes + 1) Archipel nodes up to operate properly. In other words, the automatic smart orchestrator supports (⅓ nodes - 1) Archipel nodes down at the same time within the federation. If you setup n=9 Archipel nodes authorities, you can tolerate 2 nodes down, 12 authorities you can tolerate 3 nodes down, and so forth...

**Choose your High aAvailability security level through the number of nodes that suit your cost/benefit/security requirements.**
If your number of nodes down reaches the threshold limit ( you have to monitor, man). The chain will be stalled, cannot finalize state, and heartbeat events will no longer be received by nodes. In this specific case, orchestrators react and all service nodes ( Polkadot in our case ) will automatically switch to passive mode as a precautionary measure. You can then continue to "survive" with your validator duty: administrators must manually force the service node to operate under active|passive role instead of the default automatic orchestrator mode. At this manual stage, with ARCHIPEL_SERVICE_MODE forced to ‘active’, you still benefit from the orchestrator that will monitor your Polkadot validator node to be always up and restart it if it crashes.

More information on [chain/README.md](chain/README.md)

## [Archipel Orchestrator](orchestrator/)

Orchestrator is the component that is responsible for decision making in an Archipel Federation.

On each DAppNode instance and for their instance, orchestrators daemon pilot start, stop, restart of the Polkadot node in ‘active’ (validator) or ‘passive’ (sync only).
All orchestrators need a shared state between them to operate properly. This shared state is provided by [a customized Substrate chain ](https://github.com/luguslabs/archipel/tree/master/chain) created from [Substrate node template v2.0.0-alpha.5](https://github.com/substrate-developer-hub/substrate-node-template/tree/v2.0.0-alpha.5). This is what is called: Archipel chain.


### Archipel Orchestrator Workflow

- Launch external service in passive mode
- Send node heartbeats to Archipel Chain
- Retrieve other nodes heartbeats from Archipel Chain
- Retrieve current leader from Archipel Chain and determine its availability
- If the current leader is alive, do nothing and ensure that the service was launched in passive mode
- If the current leader is not alive, try to take its place by making a transaction to Archipel Chain
- If the transaction succeeded, the current node becomes the current leader of the federation
- Do supplementary checks (anyone other is alive, Archipel Chain Node has any peers...)
- If supplementary checks pass launch external service in active mode
- You can operate multiple validator and leader inside the federation by filtering by groupId your nodes.

### Archipel Orchestrator for HA Polkadot Validator Setup

The first service targeted by Archipel is Polkadot Validator.

The N Polkadot validators ( using group filter ) node can be launched with this kind of setup :

- **1 Active mode** - Polkadot node in with validator option.
- **2 Passive mode** - Polkadot node in the sync-only mode.

We are also planning to support other services.

More information on [orchestrator/README.md](orchestrator/README.md)

### Simple federation example

4 nodes are operators
| Node | Role |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| archipel-node-1-{active or passive} | operator |
| archipel-node-2-{active or passive} | operator |
| archipel-node-3-{active or passive} | operator |
| archipel-node-4-{active or passive} | operator |

<p align="center">
 <img src=doc/images/ArchipelSimpleFederation.png width = 1000>
</p>

You must have a minimum of the 4 archipel nodes to assure consensus substrate finality. ( tolarate 1/3 -1 )

### Complex federation example

Example of complex federation with 2 groups with 9 active/passive nodes.

<p align="center">
 <img src=doc/images/ArchipelComplexFederation.png width = 1000>
</p>

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
