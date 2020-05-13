# Change Log

## Unreleased

<!--New features/improvements/fixes go here-->

## [v1.0.3](https://github.com/luguslabs/archipel/releases/tag/v1.0.3)

### Issues

[#213](https://github.com/luguslabs/archipel/issues/213): add option --rpc-methods=Unsafe for polkadot version > 0.7.33

[#215](https://github.com/luguslabs/archipel/issues/215): Have a fix name in Polkadot telemetry for the current validator

### Archipel components

| Main components | version                                                                       | docker                                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| archipel        | [v1.0.3](https://github.com/luguslabs/archipel/tree/v1.0.3/deployer/archipel) | [docker pull luguslabs/archipel:1.0.3](https://hub.docker.com/layers/luguslabs/archipel/1.0.3/images/sha256-977a26ff3046dea119791d719b5f976fdc38202463d8a9b4162e3c28aa5e065c?context=repo)         |
| archipel-cli    | [v1.0.3](https://github.com/luguslabs/archipel/tree/v1.0.3/cli)               | [docker pull luguslabs/archipel-cli:1.0.3](https://hub.docker.com/layers/luguslabs/archipel-cli/1.0.3/images/sha256-f0a5f3bcb59f478d3c524f7e6a5006436c9534b60d0ae478372c729d0c554217?context=repo) |
| archipel-ui     | [v1.0.3](https://github.com/luguslabs/archipel/tree/v1.0.3/ui)                | [docker pull luguslabs/archipel-ui:1.0.3](https://hub.docker.com/layers/luguslabs/archipel-ui/1.0.3/images/sha256-2d30eabefcb6f23a0cdcfdbd6ef01eb0615078e1cd97c4764367a61d338bf5d4?context=repo)   |

| sub components | version                                                                  | docker                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chain          | [v1.0.3](https://github.com/luguslabs/archipel/tree/v1.0.3/chain)        | [docker pull luguslabs/archipel-chain:1.0.3](https://hub.docker.com/layers/luguslabs/archipel-chain/1.0.3/images/sha256-e3b6d86f3e05ff930566788f4fff7fe8108b66d97e3ca08ddeef3f83eb4a69d8?context=repo)               |
| orchestrator   | [v1.0.3](https://github.com/luguslabs/archipel/tree/v1.0.3/orchestrator) | [docker pull luguslabs/archipel-orchestrator:1.0.3](https://hub.docker.com/layers/luguslabs/archipel-orchestrator/1.0.3/images/sha256-6ac62e661707128dc7479bea3bf053ceab81e900f90995374297a01cefd9b162?context=repo) |

### DAppNode Packages

| DAppNode Packages               | version                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| archipel.public.dappnode.eth    | [v1.0.3](https://github.com/luguslabs/DAppNodePackage-archipel/releases/tag/v1.0.3)    |
| archipel-ui.public.dappnode.eth | [v1.0.3](https://github.com/luguslabs/DAppNodePackage-archipel-ui/releases/tag/v1.0.3) |

### Archipel UI

- Archipel UI v1.0.3 IPFS link

To point an .eth domain to this website, use this hash as value:

QmV2Xh92xSQfh4AWisZw5YAY9SkVXTrs789QjgcUcmwf4D

To preview you website immediately go to:

http://my.ipfs.dnp.dappnode.eth:8080/ipfs/QmV2Xh92xSQfh4AWisZw5YAY9SkVXTrs789QjgcUcmwf4D

- [archipel.eth ENS Domain](https://app.ens.domains/name/archipel.eth) transaction IPFS content update for http://archipel.eth :

https://etherscan.io/tx/TBD

## [v1.0.2](https://github.com/luguslabs/archipel/releases/tag/v1.0.2)

### Issues

[#210](https://github.com/luguslabs/archipel/issues/210): unzip config file do not work for fresh new config

### Archipel components

| Main components | version                                                                       | docker                                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| archipel        | [v1.0.2](https://github.com/luguslabs/archipel/tree/v1.0.2/deployer/archipel) | [docker pull luguslabs/archipel:1.0.2](https://hub.docker.com/layers/luguslabs/archipel/1.0.2/images/sha256-5ac1502bbf6c7e29c7838a7b5fb1d7cbae5743897dcf4179817c49a021e0287e?context=repo)         |
| archipel-cli    | [v1.0.2](https://github.com/luguslabs/archipel/tree/v1.0.2/cli)               | [docker pull luguslabs/archipel-cli:1.0.2](https://hub.docker.com/layers/luguslabs/archipel-cli/1.0.2/images/sha256-9c280399f88c479bb3b6c6ec40562e05620649dfaa1cca1406a7bdf84bcaccda?context=repo) |
| archipel-ui     | [v1.0.2](https://github.com/luguslabs/archipel/tree/v1.0.2/ui)                | [docker pull luguslabs/archipel-ui:1.0.2](https://hub.docker.com/layers/luguslabs/archipel-ui/1.0.2/images/sha256-141e6ab4cd0da600445ed92f60606f0019a63d39450c1754eebcbe6226ccdab4?context=repo)   |

| sub components | version                                                                  | docker                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chain          | [v1.0.2](https://github.com/luguslabs/archipel/tree/v1.0.2/chain)        | [docker pull luguslabs/archipel-chain:1.0.2](https://hub.docker.com/layers/luguslabs/archipel-chain/1.0.2/images/sha256-ae156cf42ef8367bc0347d4f16df14044339a1641752c386fe74557d6d8f9a2b?context=repo)               |
| orchestrator   | [v1.0.2](https://github.com/luguslabs/archipel/tree/v1.0.2/orchestrator) | [docker pull luguslabs/archipel-orchestrator:1.0.2](https://hub.docker.com/layers/luguslabs/archipel-orchestrator/1.0.2/images/sha256-0897d85ee265c48cedccfaa96068d31e1772305fcb72fee66b0f4baecab2c13a?context=repo) |

### DAppNode Packages

| DAppNode Packages               | version                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| archipel.public.dappnode.eth    | [v1.0.2](https://github.com/luguslabs/DAppNodePackage-archipel/releases/tag/v1.0.2)    |
| archipel-ui.public.dappnode.eth | [v1.0.2](https://github.com/luguslabs/DAppNodePackage-archipel-ui/releases/tag/v1.0.2) |

### Archipel UI

- Archipel UI v1.0.2 IPFS link

To point an .eth domain to this website, use this hash as value:

QmV2Xh92xSQfh4AWisZw5YAY9SkVXTrs789QjgcUcmwf4D

To preview you website immediately go to:

http://my.ipfs.dnp.dappnode.eth:8080/ipfs/QmV2Xh92xSQfh4AWisZw5YAY9SkVXTrs789QjgcUcmwf4D

- [archipel.eth ENS Domain](https://app.ens.domains/name/archipel.eth) transaction IPFS content update for http://archipel.eth :

https://etherscan.io/tx/0x9206572b14e472e9985e72a2ee21480f15b7abd789d58d4592f097715b3931d1

## [v1.0.1](https://github.com/luguslabs/archipel/releases/tag/v1.0.1)

### Issues

- [#199](https://github.com/luguslabs/archipel/issues/199): [deployer] new zip config file loaded is used without destroying docker volume
- [#202](https://github.com/luguslabs/archipel/issues/202): [doc] Improve polkadot-keys-initialization.md doc to check Rotatekey polkadot keys value.
- [#204](https://github.com/luguslabs/archipel/issues/204):[orchestrator] Invalid transaction bug.
- [#207](https://github.com/luguslabs/archipel/issues/207): CLI breaking change in new polkadot RELEASE: v0.7.29

### Archipel components

| Main components | version                                                                       | docker                                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| archipel        | [v1.0.1](https://github.com/luguslabs/archipel/tree/v1.0.1/deployer/archipel) | [docker pull luguslabs/archipel:1.0.1](https://hub.docker.com/layers/luguslabs/archipel/1.0.1/images/sha256-84ca11aa955587a1a8f966bd493f8d639ddbfbc32c01827017152e3750bddb74?context=repo)         |
| archipel-cli    | [v1.0.1](https://github.com/luguslabs/archipel/tree/v1.0.1/cli)               | [docker pull luguslabs/archipel-cli:1.0.1](https://hub.docker.com/layers/luguslabs/archipel-cli/1.0.1/images/sha256-5fc03fd2df6c780d2c1c8ee5109c3b18e56b9e0b5fb223887e16470d20776ddb?context=repo) |
| archipel-ui     | [v1.0.1](https://github.com/luguslabs/archipel/tree/v1.0.1/ui)                | [docker pull luguslabs/archipel-ui:1.0.1](https://hub.docker.com/layers/luguslabs/archipel-ui/1.0.1/images/sha256-141e6ab4cd0da600445ed92f60606f0019a63d39450c1754eebcbe6226ccdab4?context=repo)   |

| sub components | version                                                                  | docker                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chain          | [v1.0.1](https://github.com/luguslabs/archipel/tree/v1.0.1/chain)        | [docker pull luguslabs/archipel-chain:1.0.1](https://hub.docker.com/layers/luguslabs/archipel-chain/1.0.1/images/sha256-ae156cf42ef8367bc0347d4f16df14044339a1641752c386fe74557d6d8f9a2b?context=repo)               |
| orchestrator   | [v1.0.1](https://github.com/luguslabs/archipel/tree/v1.0.1/orchestrator) | [docker pull luguslabs/archipel-orchestrator:1.0.1](https://hub.docker.com/layers/luguslabs/archipel-orchestrator/1.0.1/images/sha256-73c7163d8f6414bdcec7578e510377ac599c80e5ac7ad67eb1168f75c55b274a?context=repo) |

### DAppNode Packages

| DAppNode Packages               | version                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| archipel.public.dappnode.eth    | [v1.0.1](https://github.com/luguslabs/DAppNodePackage-archipel/releases/tag/v1.0.1)    |
| archipel-ui.public.dappnode.eth | [v1.0.1](https://github.com/luguslabs/DAppNodePackage-archipel-ui/releases/tag/v1.0.1) |

### Archipel UI

- Archipel UI v1.0.1 IPFS link

To point an .eth domain to this website, use this hash as value:

QmV2Xh92xSQfh4AWisZw5YAY9SkVXTrs789QjgcUcmwf4D

To preview you website immediately go to:

http://my.ipfs.dnp.dappnode.eth:8080/ipfs/QmV2Xh92xSQfh4AWisZw5YAY9SkVXTrs789QjgcUcmwf4D

- [archipel.eth ENS Domain](https://app.ens.domains/name/archipel.eth) transaction IPFS content update for http://archipel.eth :

https://etherscan.io/tx/0x9206572b14e472e9985e72a2ee21480f15b7abd789d58d4592f097715b3931d1

## [v1.0.0](https://github.com/luguslabs/archipel/releases/tag/v1.0.0)

### Archipel Milestone 2 overview:

- Enhanced security
  - Sentry nodes and private telemetry support
  - All traffic is secured by Wireguard VPN
- New bootstrap process
  We created Archipel CLI which generates all configuration needed to easily bootstrap an Archipel federation
  Now it takes several minutes to bootstrap one
- More intelligent orchestration decision mechanism
  Now it takes into account the real time state of Polkadot node to take an orchestration decision
- User Interface
  We added a nice user interface which shows all information about Archipel in real time
  You can also manipulate Archipel orchestrator via Archipel UI
  Mores details and all [Milestone 2 tacking](https://github.com/luguslabs/archipel/milestone/1?closed=1)

### Archipel components

| Main components | version                                                                       | docker                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| archipel        | [v1.0.0](https://github.com/luguslabs/archipel/tree/v1.0.0/deployer/archipel) | [docker pull luguslabs/archipel:1.0.0](https://hub.docker.com/layers/luguslabs/archipel/1.0.0/images/sha256-2265ac4d9692b7000ca364adc6d43db99182c731da77bef770826076f167a187?context=explore)         |
| archipel-cli    | [v1.0.0](https://github.com/luguslabs/archipel/tree/v1.0.0/cli)               | [docker pull luguslabs/archipel-cli:1.0.0](https://hub.docker.com/layers/luguslabs/archipel-cli/1.0.0/images/sha256-365f07b50de5d5ac9a2460fc0bacce0b1cb87f44c2bb522fd1db63e6acbac1fc?context=explore) |
| archipel-ui     | [v1.0.0](https://github.com/luguslabs/archipel/tree/v1.0.0/ui)                | [docker pull luguslabs/archipel-ui:1.0.0](https://hub.docker.com/layers/luguslabs/archipel-ui/1.0.0/images/sha256-a9ac15a473e7ee95fe90df41f9fa7ddcc567913fa9c40a40d0469e21a5eba648?context=explore)   |

| sub components | version                                                                  | docker                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chain          | [v1.0.0](https://github.com/luguslabs/archipel/tree/v1.0.0/chain)        | [docker pull luguslabs/archipel-chain:1.0.0](https://hub.docker.com/layers/luguslabs/archipel-chain/1.0.0/images/sha256-6f5db705fa565e6e57e5e15bc8ad74b0e0076880cbe6d5cd7642389f2a4339e8?context=explore)               |
| orchestrator   | [v1.0.0](https://github.com/luguslabs/archipel/tree/v1.0.0/orchestrator) | [docker pull luguslabs/archipel-orchestrator:1.0.0](https://hub.docker.com/layers/luguslabs/archipel-orchestrator/1.0.0/images/sha256-a1db5148b1439bd8647b9fb981866e04f2ac6f307e25642c713b450a841287b3?context=explore) |

### DAppNode Packages

| DAppNode Packages               | version                                                                                | link                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| archipel.public.dappnode.eth    | [v1.0.0](https://github.com/luguslabs/DAppNodePackage-archipel/releases/tag/v1.0.0)    | http://my.dappnode/#/installer/%2Fipfs%2FQmXvCAAtrA9uBoarW6srVy3RWNo7insxXYKcomjEP19Cgf |
| archipel-ui.public.dappnode.eth | [v1.0.0](https://github.com/luguslabs/DAppNodePackage-archipel-ui/releases/tag/v1.0.0) | http://my.dappnode/#/installer/%2Fipfs%2FQmXo7KtDytsjLuP7iwX4ocWX8s8aXk5hcSPRPB3ivrsMHL |

### Archipel UI

- Archipel UI v1.0.0 IPFS link

  QmZ6VMAgEJr9QCBGW6urSNCcRfMyG6HxPFBG6kyqwxG9ZP

- To preview you website immediately go to:

  http://my.ipfs.dnp.dappnode.eth:8080/ipfs/QmZ6VMAgEJr9QCBGW6urSNCcRfMyG6HxPFBG6kyqwxG9ZP

- [archipel.eth ENS Domain](https://app.ens.domains/name/archipel.eth) transaction IPFS content update for http://archipel.eth :

  https://etherscan.io/tx/0xc152354c1ab1191fe740cd1e0b65b37dcfdf88ab353e530f11170324a56b66e9
