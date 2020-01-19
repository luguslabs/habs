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

ARCHIPEL_PUBLIC_KEY=$(subkey inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_PUBLIC_KEY" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY no found using subkey"
      exit 1
fi


while [ true ]
do
  echo "---------author_insertKey-----------"
  curl http://localhost:9933 -s -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "aura",
       "'"$ARCHIPEL_KEY_SEED"'",
       "'"$ARCHIPEL_PUBLIC_KEY"'"
    ]
  }'
  echo "---------------------------"
  sleep 10

  #TODO exit, break when result is set in curl response

done



