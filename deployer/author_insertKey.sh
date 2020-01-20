#!/bin/sh 


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

ARCHIPEL_PUBLIC_KEY_ED25519=$(subkey --ed25519 inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')


if [ -z "$ARCHIPEL_PUBLIC_KEY_ED25519" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY_ED25519 no found using subkey"
      exit 1
fi

ARCHIPEL_PUBLIC_KEY_SR25519=$(subkey --sr25519 inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_PUBLIC_KEY_SR25519" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY_SR25519 no found using subkey"
      exit 1
fi

echo "ARCHIPEL_PUBLIC_KEY_ED25519 is $ARCHIPEL_PUBLIC_KEY_ED25519"
echo "ARCHIPEL_PUBLIC_KEY_SR25519 is $ARCHIPEL_PUBLIC_KEY_SR25519"

while [ true ]
do
  echo "---------author_insertKey GRANDPA-----------"
  curl http://localhost:9933 -s -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "aura",
       "'"$ARCHIPEL_KEY_SEED"'",
       "'"$ARCHIPEL_PUBLIC_KEY_ED25519"'"
    ]
  }'
  echo "---------------------------"

  echo "---------author_insertKey AURA-----------"
  curl http://localhost:9933 -s -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "aura",
       "'"$ARCHIPEL_KEY_SEED"'",
       "'"$ARCHIPEL_PUBLIC_KEY_SR25519"'"
    ]
  }'
  echo "---------------------------"
  sleep 10

  #TODO exit, break when result is set in curl response

done



