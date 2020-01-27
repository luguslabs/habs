# Archipel
![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Welcome to **Archipel** monorepository!

## What is Archipel

Archipel is the high availability solution for blockchain services. The first service supported is the Polkadot validator.


## Why Archipel

- Nowadays, many blockchain services are centralized on cloud infrastructure. We can imagine that in a few years some of blockchain services can be banned from public cloud services. Moreover, cloud providers can have interruption of services and network issues.
- To have decentralized infrastructure at your home, we must overcome some issues too : it’s really difficult to maintain good quality of service at home : you can have internet box or power cuts. For example it is very risky to install a Proof-of-Stake validator at home. Your PoS validator must be always up 24/7 and ready to execute it’s duty. If not, you will be slashed by the network and lose money.
To solve this problem we want to create a solution for high availability of blockchain services by federating few nodes between friends and family.


## How it works 

We use DAppNode Packages system and hardwares as a root base for the solution.
DAppnode solution is a good solution to launch a node (bitcoin, ethereum etc ...) or p2p software. But in addition to that to achieve a HA service ( like a validator node) we must add an additional service layer on top of it.
The archipel service is composed of 3 parts :
- archipel chain : federate federated node
- orchestrator : launch service and leadership decisions
- ui : basic interface to see the current status of the ederated nodes.
### archipel chain 
To federate several nodes and have a shared state to elect leader, we create a specific Substrate runtime to achived this. Substrate is a framework to easely create specific blockchain logic. This runtime also collect all nodes metrics of federation. Used for the leader selection. 
All DappNode hardware inside a federation run this substrate chain. We call it the substrate chain.
### orchestrator
 We built a daemon Archipel Orchestrator. This daemon is running on each validator nodes. It interacts with the a substrate specific to manage the validator leadership mutex. 
### ui


## Content

| Sub-repo | Description |
| --- | --- |
| [Chain](chain/) | Chain is responsible for Archipel nodes state synchronisaiton |
| [Orchestator](orchestrator/) | Orchestrator is the decision making component in Archipel federation |
| [UI](ui/) | Shows the Archipel chain state |
| [Deployer](deployer/) | Archipel End-To-End tests, build scripts and deploy tools |

## Building, running and deploying

Please refer to the instructions in sub-repositories.

You can also use the [Deployer](deployer/) sub-repository to make an automated deployment.

## References

* [Project Website](https://archipel.id)

## Acknowledgements
<p align="center">
  <img src=./web3_foundation_grants_badge.svg width = 400>
</p>

The development of Archipel is financed by [web3 foundation](https://web3.foundation/)'s grant programme. 
