# Archipel Deployment on DAppNodes 

## Install DAppNode

If you do not have physical devices. You can [buy](https://shop.dappnode.io/) hardware with DAppNode full ready to start.

On your physical device, [install DAppNode](https://dappnode.github.io/DAppNodeDocs/install/) ISO image or launch the DAppNode init script.


You will have to wait the main ethereum dappnode package to be synch to be able to install from the DNP name : `archipel.public.dappnode.eth`.

## Prerequiste

- Generate/ask for keys for the Archipel federation you want to create/join. See [Archipel keys generation doc](./archipel-keys-initialisation.md).

- Generate/ask for keys for the Polkadot validator node setup you want to create/join. See [Polkadot keys generation doc](./polkadot-keys-initialisation.md).


## Install Archipel DAppNode Package

- Connect to you DAppNode interface : http://my.dappnode/
- Go to install tab : http://my.dappnode/#/installer 
- Search with DNP `archipel.public.dappnode.eth` or with latest IPFS hash that can be find on [DAppNodePackage archipel releases](https://github.com/luguslabs/DAppNodePackage-archipel/releases)

- Click install
- Configure env variables thanks to [Archipel environment variables description](https://github.com/luguslabs/DAppNodePackage-archipel#configuration-env-parameters-needed) and keys from [Prerequiste generations keys](#Prerequiste) step.

Note :

For a first start `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` variable will be empty. All 3 nodes of the archipel must be start first before being able to valorize bootnodes list in `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS`.

- Accept disclamer
- click Submit

You can go now to the logs tab of the package to check logs start and retrieve your peer id.

## Check Archipel DAppNode Package Logs

- Connect to you DAppNode inerface : http://my.dappnode/
- Go to http://my.dappnode/#/packages tab 
- Click on Archipel Package
- Go to Logs Tabs
- In logs you must see logs from the archipel chain and the orchestrator.

## Configure Bootnode list and restart.

From [Archipe DAppNode Package logs](#check-archipel-dappnode-package-logs), extact Peer ID with présent in the following line :

Then you must update a `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` in
http://my.dappnode/#/packages/archipel.public.dappnode.eth/config
 with :

`--bootnodes /ip4/$NODE1_IP/tcp/30333/p2p/$NODE1_LOCAL_ID --bootnodes /ip4/$NODE2_IP/tcp/30333/p2p/$NODE2_LOCAL_ID --bootnodes /ip4/$NODE3_IP/tcp/30333/p2p/$NODE3_LOCAL_ID`

Then Restart all nodes of the archipel with the new `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` env varibale updated.

## Restart a Archipel Package Node

- Connect to you DAppNode inerface : http://my.dappnode/
- Go to package tab http://my.dappnode/#/packages
- click on Archipel Package  
- click on Controls tab  :http://my.dappnode/#/packages/archipel.public.dappnode.eth/controls
- click restart.

## Check Archipel Node Status

- You can check [Archipel DAppnodePackage logs](#check-archipel-dappnode-package-logs)
- You can see your external service node polkadot with -active  or -passive suffix in [Polkadot Telemetry](https://telemetry.polkadot.io/#/Kusama%20CC3)
- Soon [Archipel UI](https://github.com/luguslabs/archipel/tree/master/ui) will be availbale also as a DappNode package to also check your current archipel status.
