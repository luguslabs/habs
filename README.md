# Archipel
![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

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
We are using [DAppNode](https://dappnode.io/) as the infrastructure layer for our solution. 
With DAppNode, you can launch a blockchain node (Bitcoin, Ethereum ...) or any P2P software.
To achieve the high availability of services, we are adding a service layer (Archipel) on top of it.

## Archipel Components
| Compotent | Description |
| --- | --- |
| [Chain](chain/) | Chain component is responsible for Archipel state synchronization between participants |
| [Orchestator](orchestrator/) | Orchestrator is the decision-making component in Archipel federation |
| [UI](ui/) | UI is the Archipel chain state visualization component |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel |

## Building
Please refer to the README instructions in sub-repositories.

## Running with Docker
### Archipel (Validator Archipel Chain Node + Orchestrator)
```bash
docker run ....
```
### Archipel Node (Non-Validator Archipel Chain Node)
``` bash
docker run ...
```
### Archipel UI
```bash
docker run -d -p 8080:80 luguslabs/archipel-ui
```
* The Archipel UI will be avaliable at http://localhost:8080
* Make sure that the 8080 port is available 

## [Archipel chain](https://github.com/luguslabs/archipel/tree/master/chain)
To federate several nodes and have a shared state to elect leader, we created a specific blockchain using Substrate framework. 
[Substrate](https://substrate.dev/) is a Parity framework that allows to create application specific blockchains. 
We created a Substrate runtime that collects all nodes metrics and sets federation leader. This helps Archipel orchestrator to select the best leader appropriately in the federation. 
We call this specific blockchain the Archipel Substrate Chain or Archipel Chain.
All nodes inside a federation, run Archipel Chain.
In the current implementation, an Archipel must be composed of 3 nodes. That means that to operate, you have to setup 3 nodes. Try to setup nodes in different locations using different ISPs.
The idea is that in Archipel federation, all participants are trusted. They can be friends or family or other trusted social links. That allows us to have a fast chain consenus. 
At this moment, we are using the AURA Substrate consensus.

### [Archipel Runtime](https://github.com/luguslabs/archipel/blob/master/chain/runtime/src/archipel.rs) 
The Archipel Runtime has 2 fonctions that can be called by all the 3 archipel nodes of the federation :
- `set_leader(origin, old_leader: T::AccountId)`: 

When the algorithm in the orchestrator detect a leadership necessity to start. Before starting in active mode (aka validator mode), a `set_leader` transaction is propagated by the candidate node. In this `set_leader` call function, the candidate node must indicates parameter `old_leader` : the current node seen as bad or down leader from his point of view. The candidate node will only start his validator duty, if it sees his `set_leader` transaction finilized sucessflully.
This `set_leader` call, with 3 nodes in the archipel, allows to prevent 2 nodes to start validating in the same time. We will see if this simpe algorithm must be evolved to cover all equivocation. In the algorithm, we will prefere an archipel service down instead of [equivocation](https://guide.kusama.network/en/latest/try/secure-validator-setup/#high-availability) on the network and heavy slashes.
- `add_metrics(origin, metrics_value: u32)`: 

It is an heartbeat transaction that allow to detect node liveness and detect network or power crash of the current leader. If no transactions received `add_metrics` from an entities, the orchestrator will react. `metrics_value` parameter is not used at te moment. In the future, metrics details could be added and stored to have a more accurate state or leaders selection optmisations. 


Note : 

As all the project is dockerize, you can launch also 1, 2, or 3 Archipel chain containers into cloud providers but this not the end goal of the solution. You can find others system to garantee HA or failover in cloud. Here the goal is to setup an HA on decentralized infrastructures. For instance using DAppNode.

## [Orchestrator](https://github.com/luguslabs/archipel/tree/master/orchestrator)

Orchestrator is a node program that is responsible of serveral actions. It :
- starts/stops external docker services to guarantee the HA.
- switches the external service from active to passive mode.
- switches the external service from passive to active mode.
- retrieves state from the archipel chain.
- propagates transactions `set_leader` and `add_metrics` in archipel chain.
- implements the leadership algorithm. With Archipel chain state as inputs. As output, we have a transactions sent and external services start/stop/switch.

In our first scenario for Archipel, the external service targeted is a polkadot validator. Active mode is a pokadot node with validator option. The passive mode is a polkadot full node only synching.
We have others services to target in mind.

## [UI](https://github.com/luguslabs/archipel/tree/master/ui)

Shows the Archipel chain state with the current leader node and all federation nodes status and metrics.

## [Deployer](https://github.com/luguslabs/archipel/tree/master/deployer)

| folder| Description |
| --- | --- |
| [archipel-docker](deployer/archipel-docker/) | docker image contains Archipel Chain and orchestrator components. Versioning also available on [docker hub luguslabs/archipel](https://hub.docker.com/repository/docker/luguslabs/archipel) |
| [archipel-node-docker](deployer/archipel-node-docker) |  docker image to run a single archipel Node. Versioning also available on [docker hub luguslabs/archipel-node](https://hub.docker.com/r/luguslabs/archipel-node)|
| [test](deployer/test) | scripts to sandbox and test all Archipel functionalities |


## [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel)

DAppNode package wrapping Archipel to one click install Archipel from the DAppNode interface (Package Registry using Ethereum and IPFS).

Details in DAppNode Package [README](https://github.com/luguslabs/DAppNodePackage-archipel)

## References

* [Project Website](https://archipel.id)

## Acknowledgements
<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The bootstrap development of Archipel is financed by [web3 foundation](https://web3.foundation/)'s grant programme [Wave4](https://medium.com/web3foundation/wrap-up-for-winter-with-our-wave-four-grant-recipients-52c27b831a6e). Thank you very much.
