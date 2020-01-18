#!/bin/sh 

#check env vars.


if [ -z "$ARCHIPEL_NODE_ALIAS" ]
then
      echo "\$ARCHIPEL_NODE_ALIAS is empty"
      exit 1
fi

if [ -z "$ARCHIPEL_KEY_SEED" ]
then
      echo "\$ARCHIPEL_KEY_SEED is empty"
      exit 1
fi


if [ ! -f /usr/local/bin/subkey ]
then
      echo "missing utils subkey command. Needed to extracts key parts"
      exit 1
fi

ARCHIPEL_SS58_ADDRESS=$(subkey inspect "$ARCHIPEL_KEY_SEED" | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS" ]
then
      echo "\$ARCHIPEL_SS58_ADDRESS no found using subkey"
      exit 1
fi


ARCHIPEL_PUBLIC_KEY=$(subkey inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY no found using subkey"
      exit 1
fi

echo "decoded from seed : ARCHIPEL_SS58_ADDRESS : $ARCHIPEL_SS58_ADDRESS"
echo "decoded from seed : ARCHIPEL_PUBLIC_KEY : $ARCHIPEL_PUBLIC_KEY"

# Constants
# ARCHIPEL_KEY_TYPE possible values : gran babe imon para
ARCHIPEL_KEY_TYPE=imon

# Valorized config spec chain template with envs varabales

if [ ! -f "/root/chain/archipelTemplateSpec.json" ]
then
      echo "missing chain spec template /root/chain/archipelTemplateSpec.json"
      exit 1
fi

# clear bootnodes array in template 
cp  -f /root/chain/archipelTemplateSpec.json /root/chain/archipelSpec.json
cat /root/chain/archipelSpec.json | jq '.bootNodes = []'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

#TODO add bootnodes list from env vars


# replace  "name": "Template"
cat /root/chain/archipelSpec.json | jq  '.name = "Archipel"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# replace  "id": "template"
cat /root/chain/archipelSpec.json | jq  '.id = "archipel"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# replace "protocolId"
cat /root/chain/archipelSpec.json | jq  '.protocolId = "1984"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to aura.authorities 
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.aura.authorities = [$ARCHIPEL_SS58_ADDRESS]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to grandpa.authorities 
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.grandpa.authorities = [[$ARCHIPEL_SS58_ADDRESS , 1]]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to indices
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.indices.ids = [$ARCHIPEL_SS58_ADDRESS]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to indices
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.balances.balances = [[$ARCHIPEL_SS58_ADDRESS , 1152921504606846976]]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress as sudo key 
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.sudo.key = $ARCHIPEL_SS58_ADDRESS'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json


# generate raw spec file 
/root/chain/archipel build-spec --chain=/root/chain/archipelSpec.json --raw > /root/chain/archipelSpecRaw.json

# launch chain 
exec /root/chain/archipel --chain=/root/chain/archipelSpecRaw.json  --base-path /root/chain/data


#TODO insert account key in node after start