#!/bin/sh 

while [ true ]
do
  echo "---------PEER_ID-----------"
  curl -H "Content-Type: application/json" -s -d '{"id":1, "jsonrpc":"2.0", "method": "system_networkState", "params":[]}' http://localhost:9933 | jq  '.result.peerId'
  echo "---------------------------"
  echo "---------isSyncing-----------"
  curl -H "Content-Type: application/json" -s -d '{"id":1, "jsonrpc":"2.0", "method": "system_health", "params":[]}' http://localhost:9933 | jq  '.result.isSyncing'
  echo "---------------------------"
  echo "---------peers-----------"
  curl -H "Content-Type: application/json" -s -d '{"id":1, "jsonrpc":"2.0", "method": "system_health", "params":[]}' http://localhost:9933 | jq  '.result.peers'
  echo "---------------------------"
  sleep 10

done


# API culr exemple
#curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_health", "params":[]}' http://localhost:9933
##{"jsonrpc":"2.0","result":{"isSyncing":false,"peers":0,"shouldHavePeers":true},"id":1}
#curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_networkState", "params":[]}' http://localhost:9933
##{"jsonrpc":"2.0","result":{"averageDownloadPerSec":235,"averageUploadPerSec":235,"connectedPeers":{},"externalAddresses":[],"listenedAddresses":["/ip4/172.17.0.2/tcp/30333","/ip4/127.0.0.1/tcp/30333"],"notConnectedPeers":{"QmeWRVeNwHgoHskrNBkY8SSAP3kAT7wu9HS7yCaFx8zm6s":{"knownAddresses":["/ip4/127.0.0.1/tcp/30333"],"latestPingTime":null,"versionString":null}},"peerId":"QmXgmybphaXtASzah8bGtWDbN9rYMjVxQmKNqAAHBU4Z8j","peerset":{"message_queue":0,"nodes":{"QmeWRVeNwHgoHskrNBkY8SSAP3kAT7wu9HS7yCaFx8zm6s":{"connected":true,"reputation":-102}},"reserved_only":false}},"id":1}

