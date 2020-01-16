#!/bin/sh 

#check env vars.

if [ -z "$ARCHIPEL_NODE_ALIAS" ]
then
      echo "\$ARCHIPEL_NODE_ALIAS is empty"
      exit 1
fi


if [ -z "$ARCHIPEL_NODE_ADDRESS" ]
then
      echo "\$ARCHIPEL_NODE_ADDRESS is empty"
      exit 1
fi

if [ ! -f "/config/archipel/archipel_node_keystore.json" ]
then
      echo "missing keystore file /config/archipel/archipel_node_keystore.json"
      exit 1
fi

# ARCHIPEL_BOOTNODES env is optional 

# Calorized config spec chain template with envs varabales


if [ ! -f "/root/chain/archipelTemplateSpecRaw.json" ]
then
      echo "missing chain spec template /root/chain/archipelTemplateSpecRaw.json"
      exit 1
fi


# TODO add params start

CLI_CHAIN_OPTIONS=
# launch chain 
exec /root/chain/archipel $CLI_CHAIN_OPTIONS
