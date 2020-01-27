# Archipel
![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Welcome to **Archipel** monorepository!

## What is Archipel

Archipel is an high availability solution for blockchain services. The first service supported is the Polkadot validator.


## Why Archipel

Nowadays, many blockchain services are centralized on cloud infrastructures. For instance, around [70% of Ethereum nodes are in VPC](https://twitter.com/DAppNode/status/1108693643320270848?s=20) and 63% of Ethereum Dapps use Infura Provider as [this survey](https://medium.com/fluence-network/dapp-survey-results-2019-a04373db6452)show. We can imagine that in a few years some of blockchain services can be banned from public cloud services. Moreover, cloud providers can have interruption of services and network issues. And what about the political decentralization of what the web3 claim to build ?

To have decentralized infrastructure at your home, we must overcome some issues too : it’s really difficult to maintain good quality of service at home : you can have internet box or power cuts. For example it is very risky to install a Proof-of-Stake validator at home. Your PoS validator must be always up 24/7 and ready to execute it’s duty. If not, you will be slashed by the network and lose money.
To solve this problem we want to create a solution for high availability of blockchain services by federating few nodes between friends and family.

## How it works 

We use [DAppNode](https://dappnode.io/) and [hardwares](https://shop.dappnode.io/) as a root base for the solution. 
DAppnode is a good solution to launch a node (bitcoin, ethereum etc ...) or p2p softwares with Packages Management system and one click install for the end users. But, in addition to that, to achieve a HA (High-availibility) service ( like a validator node), we must add an service layer on top of it. This is what we call Archipel. Archipel is composed those 5 parts :


## Content

| Sub-repo | Description |
| --- | --- |
| [Chain](chain/) | Chain is responsible for Archipel nodes state synchronisaiton |
| [Orchestator](orchestrator/) | Orchestrator is the decision making component in Archipel federation |
| [UI](ui/) | Shows the Archipel chain state |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |
| [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel) | DAppNode package wrapping Archipel docker images. |

## Building, running and deploying

Please refer to the README instructions in sub-repositories.

You can also use the [Deployer](deployer/) sub-repository to make an automated deployment.


## [Archipel chain](https://github.com/luguslabs/archipel/tree/master/chain)
To federate several nodes and have a shared state to elect leader, we create a specific Substrate runtime to achived this. [Substrate](https://substrate.dev/) is a Parity framework to easely create blockchain specific logics. This runtime also collects all nodes metrics to be able to select the best leader appropriately in the federation. 
All DappNode hardwares inside a federation, run this substrate node. We call it the Archipel substrate chain or Archipel Chain.
In the current implementation, an Archipel chain is composed of 3 nodes. That means that to operate, you have to setup or find 3 DAppNodes in differents location. ( different ISP is better also). 
In Archipel Chain, authorities are trusted (friends or familly or social links etc ...). So, the chain consenus used can be fast. At the moment, our first milestone, we use the default substrate consensus.
The [Archipel runtime](https://github.com/luguslabs/archipel/blob/master/chain/runtime/src/archipel.rs) has 2 fonctions that can be called by all the 3 archipel nodes of the federation :
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
- propagates transactions `set_Leader` and `add_metrics` in archipel chain.
- implements the leadership algorithm. With Archipel chain state as inputs. As output, we have a transactions sent and external services start/stop/switch.

In our first scenario for Archipel, the external service targeted is a polkadot validator. Active mode is a pokadot node with validator option. The passive mode is a polkadot full node only synching.
We have others services to target in mind.

Note :

We choose Node js because of the [Substrate js api reference](https://github.com/polkadot-js/api) and well coverage.


 
## [UI](https://github.com/luguslabs/archipel/tree/master/ui)

Shows the Archipel chain state with the current leader node and all federation nodes status and metrics.

## [Deployer](https://github.com/luguslabs/archipel/tree/master/deployer)

| folder| Description |
| --- | --- |
| [archipel-docker](deployer/archipel-docker/) | docker image contains Archipel Chain and orchestrator components. Versioning also available on [docker hub luguslabs/archipel](https://hub.docker.com/repository/docker/luguslabs/archipel) |
| [archipel-node-docker](deployer/archipel-node-docker) |  docker image to run a single archipel Node. Versioning also available on [docker hub luguslabs/archipel-node](https://hub.docker.com/r/luguslabs/archipel-node)|
| [test](deployer/test) | scripts to sandbox and test all Archipel functionalities |


## [DAppNodePackage](https://github.com/luguslabs/DAppNodePackage-archipel)

DAppNode package wrapping Archipel docker images to one click install Archipel from the DAppNode interface (Package Registry using Ethereum and IPFS).

Details in DAppNode Package [README](https://github.com/luguslabs/DAppNodePackage-archipel)

## References

* [Project Website](https://archipel.id)

## Acknowledgements
<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The bootstrap development of Archipel is financed by [web3 foundation](https://web3.foundation/)'s grant programme [Wave4](https://medium.com/web3foundation/wrap-up-for-winter-with-our-wave-four-grant-recipients-52c27b831a6e). Thank you very much.
