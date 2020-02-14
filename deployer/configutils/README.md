# Config utils

## Generate new PEER_ID|NODE_KEY for libp2p networking

```bash
git clone https://github.com/luguslabs/archipel.git
cd deployer/configutils
npm i
node generateNewNodeKeys.js
```
Expected result :

```bash
PEER_ID=QmaZ9T6D5UfuPRyqT8BtqamrP6YcMYBBkY6WBdPzUx4v95
NODE_KEY=1220b57fb5e2ed430f78fda6c837d98ddf014f2944516498ec15afbfad0a2120be50
```

##  Get PEER_ID format from NODE_KEY

```bash
git clone https://github.com/luguslabs/archipel.git
cd deployer/configutils
npm i
node getIdFromNodeKey.js 122030863cead05f244be78b1f9a1308836fdf5a6cb3b2d430e4da0d402010aff569
``` 

Expected result :

```bash
PEER_ID=QmRc4zwSzoyoZC7em8sent8t1j1G9TZY6c58qB83kLbCRE
NODE_KEY=122030863cead05f244be78b1f9a1308836fdf5a6cb3b2d430e4da0d402010aff569
```


