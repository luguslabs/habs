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

We use [DAppNode](https://dappnode.io/) Packages system and [hardwares](https://shop.dappnode.io/) as a root base for the solution.
DAppnode solution is a good solution to launch a node (bitcoin, ethereum etc ...) or p2p softwares. But, in addition to that, to achieve a HA (High-availibility) service ( like a validator node), we must add an additional service layer on top of it. This is what we call Archipel. Archipel service is composed those 5 parts :


## Content

| Sub-repo | Description |
| --- | --- |
| [Chain](chain/) | Chain is responsible for Archipel nodes state synchronisaiton |
| [Orchestator](orchestrator/) | Orchestrator is the decision making component in Archipel federation |
| [UI](ui/) | Shows the Archipel chain state |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel docker images. |

## Building, running and deploying

Please refer to the instructions in sub-repositories.

You can also use the [Deployer](deployer/) sub-repository to make an automated deployment.


## [Archipel chain](https://github.com/luguslabs/archipel/tree/master/chain)
To federate several nodes and have a shared state to elect leader, we create a specific Substrate runtime to achived this. [Substrate](https://substrate.dev/) is a Parity framework to easely create blockchain specific logics. This runtime also collect all nodes metrics of federation to be able to select the best leader appropriately. 
All DappNode hardwares inside a federation, run this this substrate node service. We call it the Archipel substrate chain or Archipel Chain.
In the current implementation, an Archipel chain is composed of 3 nodes. That means that to operate, you have to setup or find 3 DAppNodes in differents location. ( different ISP is better also). 
In Archipel Chain, authorities are trusted (friends or familly or social links etc ...). The chain consenus used can be fast. At the moment, our first milestone, we use the default substrate consensus.
The [Archipel runtime](https://github.com/luguslabs/archipel/blob/master/chain/runtime/src/archipel.rs) has 2 fonctions that can be called by all the 3 nodes entities of the federation :
- set_leader(origin, old_leader: T::AccountId): 

When the algorithm in the orchestrator detect a leadership necessity to start. Before starting the leader (in active mode. aka validator mode), a set_leader transaction is propagated by the candidate node. In this set_leader call function, the candidate node must indicates parameter 'old_leader' : the current node seen as bad or down leader from his point of view. The candidate node will only start his validator duty, if he sees his set_leader transaction finilized sucessflully.
This set_leader call, with 3 nodes in the archipel, allows to prevent 2 nodes to start validating in the same time. We will see if this simpe algorithm must be evolved to cover all equivocation. In the algorithm, we will prefere an archipel service down instead of [equivocation] on the network and heavy slashes.(https://guide.kusama.network/en/latest/try/secure-validator-setup/#high-availability)

- add_metrics(origin, metrics_value: u32) : 

It is an heartbeat transaction that allow to detect node liveness and detect network or power crash of the current leader. If no transactions received add_metrics from an entities, the orchestrator will react. Metrics_value parameter is not used at te moment. In the future, metrics details could be added and stored to have a more accurate state or leaders selection optmisations. 


Note : As all the project are dockerize, you can launch also 1, 2, or 3 Archipel chain containers into cloud providers but this not the end goal of the solution. You can find others system to garantee HA or failover in cloud. Here the goal is to setup an HA on decentralized infrastructures. For instance using [DAppNode](https://dappnode.io/)

## [Orchestrator](https://github.com/luguslabs/archipel/tree/master/orchestrator)

In our first case, the active mode is a polkadot in validator option and a passive mode is a polkadot node just synching. The orechtrator is aand leadership decisions
 
 
## [UI](https://github.com/luguslabs/archipel/tree/master/ui)
TODO

## [Deployer](https://github.com/luguslabs/archipel/tree/master/deployer)

TODO

## [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel)

DAppNode package wrapping Archipel docker images to one click install Archipel from the DAppNode interface (Package Registry using Ethereum and IPFS).

Details in DAppNode Package [README](https://github.com/luguslabs/DAppNodePackage-archipel)

## References

* [Project Website](https://archipel.id)

## Acknowledgements
<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The development of Archipel is financed by [web3 foundation](https://web3.foundation/)'s grant programme. 
