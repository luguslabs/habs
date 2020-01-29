# Keys initialisation 

The bootstrap of an Archipel chain needs a pre-requiste keys generation.
Those keys will be use for the node identities in the federation and use for authoring blocks and chain consensus, transactions propagation of runtime functions calls. Moreover, in addition to [Archipel keys](#archipel-keys), you need to create keys for your external service. For the first supported external service polkadot, you have to generate [Polkadot keys](#polkadot-keys) for the validator service to operate properly.


## Subkey Tool

Archipel and polkadot use [Substrate](https://substrate.dev/) framework. This framwork has utility tool to generate keys. You will use it to facilitate the keys generation. The first step is to [download and install subkey](https://substrate.dev/docs/en/ecosystem/subkey#installation). Then check subkey installation and options available :

```bash
subkey --version
subkey --help
```
Create a specific folder and generate key on a secure device with all securities regarding privates keys generation in crypto in general (internet cut-off etc ...). 


## Archipel keys

The minimal nodes of an archipel is 3. You need to generate keys for this 3 nodes.

You can generate those keys [step-by-step](#archipel-step-by-step-keys-creation) to understand better and repeat 3 times for the 3 nodes.
There is also a [full steps command line](#archipel-full-steps-keys-creation) to generate quickly when you master it like a ninja.

### Archipel Step by step keys creation
```bash
subkey -n substrate generate > archipel-node1-sr25519.keys 
```

Note : the default keys generation is a sr25519. To be sure, you can also specify -s or --sr25519 option.

You will need the ed25519 keys format from the same seed. To do this you will first extract the phrase seed 12 mnemonic words of node 1 from archipel-node1-sr25519.keys file. then you keep the seed phrase in another file : archipel-node1.seed

```bash
cat archipel-node1-sr25519.keys | grep phrase | cut -d"\`" -f2 > archipel-node1.seed
```

now you can extract ed25519 keys format from phrase of archipel-node1.seed with :

```bash
subkey -n substrate --ed25519 inspect "$(<archipel-node1.seed)" > archipel-node1-ed25519.keys 
```

repeat the same commands above for node 2 and node 3. Or use this shortcut loop :

### Archipel Full steps keys creation

```bash
for i in `seq 1 3`; do echo "create keys archipel-node$i" && subkey -n substrate generate > archipel-node$i-sr25519.keys && cat archipel-node$i-sr25519.keys | grep phrase | cut -d"\`" -f2 > archipel-node$i.seed && subkey -n substrate --ed25519 inspect "$(<archipel-node$i.seed)" > archipel-node$i-ed25519.keys ; done
```

### Archipel keys creation expected result

In your foder you must have now 9 files :
```bash
archipel-node1-ed25519.keys
archipel-node1.seed
archipel-node1-sr25519.keys
archipel-node2-ed25519.keys
archipel-node2.seed
archipel-node2-sr25519.keys
archipel-node3-ed25519.keys
archipel-node3.seed
archipel-node3-sr25519.keys
```

### Matching archipel files keys with Archpel env variables

- ARCHIPEL_KEY_SEED=what you find into your archipel-node1|2|3.seed file.

- ARCHIPEL_AUTHORITIES_SR25519_LIST=<SS58 Address of archipel-node1-sr25519.keys>,<SS58 Address of archipel-node2-sr25519.keys>,<SS58 Address of archipel-node3-sr25519.keys>
- ARCHIPEL_AUTHORITIES_ED25519_LIST=<SS58 Address of archipel-node1-ed25519.keys>,<SS58 Address of archipel-node2-ed25519.keys>,<SS58 Address of archipel-node3-ed25519.keys>


ARCHIPEL_AUTHORITIES_SR25519_LIST and ARCHIPEL_AUTHORITIES_ED25519_LIST are the same values for your 3 archipel nodes.

Lazy ? Here a utils commands to generate ARCHIPEL_AUTHORITIES_SR25519_LIST and ARCHIPEL_AUTHORITIES_ED25519_LIST value from files :

- ARCHIPEL_KEY_SEED
select line according to node number you whant to valorize
```bash
export ARCHIPEL_KEY_SEED=$(cat archipel-node1.seed)
```
or
```bash
export ARCHIPEL_KEY_SEED=$(cat archipel-node2.seed)
```
or
```bash
export ARCHIPEL_KEY_SEED=$(cat archipel-node3.seed)
```

- ARCHIPEL_AUTHORITIES_SR25519_LIST
```bash
export ARCHIPEL_AUTHORITIES_SR25519_LIST=$(cat archipel-node1-sr25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node2-sr25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node3-sr25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')
```

- ARCHIPEL_AUTHORITIES_ED25519_LIST
```bash
export ARCHIPEL_AUTHORITIES_ED25519_LIST=$(cat archipel-node1-ed25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node2-ed25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node3-ed25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')
```

## Polkadot keys

Start by understanding the key concept of polkadot keys by reading the [official documentation here](https://wiki.polkadot.network/docs/en/learn-keys).

In this doc, we will only concentrate one the creation of the 5 sessions keys. Because this is what is necessary to operate the validator node that running on the DAppNode. Thoses sessions keys must be set in the [ Archipel environement variables](https://github.com/luguslabs/archipel#environment-variables). All others keys requirement explained in the offical Polkadot doc must be respected and done for those who want to [run a validator on kusama](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama).

All 3 DappNodes form the archipel will share the same 5 sessions keys.

### Polkadot Sessions Keys format explained

In orchestrator env you must valorize 5 sessions keys to be able to launch Polkadot validator node and validate the network.

This orchestrator programm will insert at start thoses 5 sessions keys into the polkadot node keystore.

It simulates what the rotateKeys function call do. Instead of one rpc call of **rotate_keys**, it calls 5 times insertKey rpc call. But the end result is the same.
You can see how to call and details of rotate_keys function [here](
https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#generating-the-session-key)

RotateKeys function call generate 5 sessions keys. 

5 keys are generated in the keystore by rotate_keys rpc call.
In the keystore path, key file name is formated like this :  

stringToHex("keyType")+<Public key>

For the 5 keys generated in the keystore, file **prefix** are :
- stringToHex("gran")=6772616e
- stringToHex("babe")=62616265
- stringToHex("imon")=696d6f6e
- stringToHex("para")=70617261
- stringToHex("audi")=61756469

The file itself contains the 12 seed words secret. 

To find the accurate Public key ( using subkey tool for instance ) here keyType mapping:

- gran = ed25519
- babe = sr25519
- imon = sr25519
- para = sr25519
- audi = sr25519

RotateKeys function call return an aggregate key of all 5 public Keys. Here the format retunr :
0x"ed25519 **gran** Public Key" +
"sr25519 **babe** Public Key" +
"sr25519 **imon** Public Key" +
"sr25519 **para** Public Key" +
"sr25519 **audi** Public Key" 

then, this full aggregate key must submit on chain before beeing able to validate on the network as explained [here](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#submitting-the-setkeys-transaction)


### Create 5 Polkadot sessions keys

#### Polkadot Step by step session keys creation

- Gran session key 
```bash
subkey -n kusama --ed25519 generate > kusama-session-gran-ed25519.keys 
cat kusama-session-gran-ed25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-gran.seed
```

- Babe session key 
```bash
subkey -n kusama --sr25519 generate > kusama-session-babe-sr25519.keys 
cat kusama-session-babe-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-babe.seed
```

- Imon session key 
```bash
subkey -n kusama --sr25519 generate > kusama-session-imon-sr25519.keys 
cat kusama-session-imon-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-imon.seed
```

- Para session key 
```bash
subkey -n kusama --sr25519 generate > kusama-session-para-sr25519.keys 
cat kusama-session-para-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-para.seed
```

- Audi session key 
```bash
subkey -n kusama --sr25519 generate > kusama-session-audi-sr25519.keys 
cat kusama-session-audi-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-audi.seed
```

#### Polkadot Full steps session keys creation

```bash
subkey -n kusama --ed25519 generate > kusama-session-gran-ed25519.keys 
cat kusama-session-gran-ed25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-gran.seed
subkey -n kusama --sr25519 generate > kusama-session-babe-sr25519.keys 
cat kusama-session-babe-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-babe.seed
subkey -n kusama --sr25519 generate > kusama-session-imon-sr25519.keys 
cat kusama-session-imon-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-imon.seed
subkey -n kusama --sr25519 generate > kusama-session-para-sr25519.keys 
cat kusama-session-para-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-para.seed
subkey -n kusama --sr25519 generate > kusama-session-audi-sr25519.keys 
cat kusama-session-audi-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-audi.seed
```

### Matching Polkadot sessions files keys with Archipel env variables


```bash
export POLKADOT_KEY_GRAN=$(cat kusama-session-gran.seed)
export POLKADOT_KEY_BABE=$(cat kusama-session-babe.seed)
export POLKADOT_KEY_IMON=$(cat kusama-session-imon.seed)
export POLKADOT_KEY_PARA=$(cat kusama-session-para.seed)
export POLKADOT_KEY_AUDI=$(cat kusama-session-audi.seed)
```

### Generate setKey value from 5 sesssions in env
As [explained above](polkadot-sessions-keys-format-explained) the format generated by `rotate_key` is :
0x"ed25519 **gran** Public Key" +
"sr25519 **babe** Public Key" +
"sr25519 **imon** Public Key" +
"sr25519 **para** Public Key" +
"sr25519 **audi** Public Key" 

You need to send this information on chain to be able to validate. you can read more on [submitting-the-setkeys-transaction doc](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#submitting-the-setkeys-transaction).
Here how to extract the value from env varibale :

```bash
export ROTATE_KEY=$(cat kusama-session-gran-ed25519.keys | grep Public | cut -d":" -f2)$(cat kusama-session-babe-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)$(cat kusama-session-imon-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)$(cat kusama-session-para-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)$(cat kusama-session-audi-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)
```
