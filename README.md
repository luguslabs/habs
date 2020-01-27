# Archipel
![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Welcome to **Archipel** monorepository!

## What is Archipel

Archipel is the high availability solution for blockchain services. The first service supported is the Polkadot validator.


## Why Archipel

Nowadays, many blockchain services are centralized on cloud infrastructure. We can imagine that in a few years some of blockchain services can be banned from public cloud services. Moreover, cloud providers can have interruption of services and network issues.

To have decentralized infrastructure at your home, we must overcome some issues too : it’s really difficult to maintain good quality of service at home : you can have internet box or power cuts. For example it is very risky to install a Proof-of-Stake validator at home. Your PoS validator must be always up 24/7 and ready to execute it’s duty. If not, you will be slashed by the network and lose money.
To solve this problem we want to create a solution for high availability of blockchain services by federating few nodes between friends and family.

## How it works 

We use DAppNode Packages system and hardwares as a root base for the solution.
DAppnode solution is a good solution to launch a node (bitcoin, ethereum etc ...) or p2p softwares. But, in addition to that, to achieve a HA (High-availibility) service ( like a validator node), we must add an additional service layer on top of it. This is what we call Archipel. Archipel service is composed those 5 parts :


## Content

| Sub-repo | Description |
| --- | --- |
| [Chain](chain/) | Chain is responsible for Archipel nodes state synchronisaiton |
| [Orchestator](orchestrator/) | Orchestrator is the decision making component in Archipel federation |
| [UI](ui/) | Shows the Archipel chain state |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel docker images to one click install Archipel from the DAppNode interface (Package Registry using Ethereum and IPFS) |

## Building, running and deploying

Please refer to the instructions in sub-repositories.

You can also use the [Deployer](deployer/) sub-repository to make an automated deployment.


## [Archipel chain](https://github.com/luguslabs/archipel/tree/master/chain)
To federate several nodes and have a shared state to elect leader, we create a specific Substrate runtime to achived this. [Substrate](https://substrate.dev/) is a Parity framework to easely create specific blockchain logics. This runtime also collect all nodes metrics of federation to be able to seect the leader appropriately. 
All DappNode hardware inside a federation run this substrate node. We call it the Archipel substrate chain or Archipel Chain.
In the current implementation, the Archipel chain is composed of 3 nodes. That means that to operate, you have to setup or find 3 DAppNodes in differents location. ( different ISP is better also). 
In Archipel Chain authorities are trusted. The chain consenus used can be fast. For the moment and first milestone, we use the default substrate consensus.
The [Archipel runtime](https://github.com/luguslabs/archipel/blob/master/chain/runtime/src/archipel.rs) has 2 fonctions that can be called all the 3 nodes entity of the federation :
- set_leader(origin, old_leader: T::AccountId): 

When the algorithm in the orchestraor detect a leadership necessity to change or to start. Before starting the leader (in active mode. aka validator mode), a transaction is propagated to take. The node that wanted to take the leadership, must indicate in params 'old_leader' the current node seeing as leader and certainly down.
With 3 nodes in the archipel, it allows to prevent 2 nodes to start as validator at the same time.
- add_metrics(origin, metrics_value: u32) : 

It is a heartbeat transaction that allow to detect since when a node is not active or down in case of no transactions received. No params are used. Metrics_value is not used. In the future, metrics could be added to have a more accurate state or leader selection optmisations. 


Note : As all the project are dockerize, you can launch also 1, 2, or 3 containers into cloud providers but this not the end goal of the solution. You can find others system to garantee HA or failover in cloud. Here the goal is to setup an HA on decentralized infrastructures.

## [Orchestrator](https://github.com/luguslabs/archipel/tree/master/orchestrator)

In our first case, the active mode is a polkadot in validator option and a passive mode is a polkadot node just synching. The orechtrator is aand leadership decisions
 
 
## [UI](https://github.com/luguslabs/archipel/tree/master/ui)
TODO

## [Deployer](https://github.com/luguslabs/archipel/tree/master/deployer)

TODO

## [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel)

  Details in DAppNode Package [README](https://github.com/luguslabs/DAppNodePackage-archipel)

## References

* [Project Website](https://archipel.id)

## Acknowledgements
<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The development of Archipel is financed by [web3 foundation](https://web3.foundation/)'s grant programme. 
