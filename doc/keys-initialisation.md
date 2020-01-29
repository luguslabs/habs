# Keys initialisation 

The bootstrap of an Archipel chain needs a pre-requiste keys generation.
Those keys will be use for the node identities in the federation and use for authoring blocks and chain consensus, transactions propagation of runtime functions calls. Moreover, in addition to [Archipel keys](#archipel-keys), you need to create keys for your external service. For the first supported external service polkadot, you have to generate [Polkadot keys](#polkadot-keys) for the validator service top operate properly.


## Subkey key Tool

Archipel and polkadot use substrate framework. This framwork has utility tool to generate keys. We will use it to facilitate the keys generation. The first step is to [download and install subkey](https://substrate.dev/docs/en/ecosystem/subkey#installation). Then check subkey installation and options available :

```bash
subkey --version
subkey --help
```
Create a specific folder and generate key on a secure device with all securities regarding privates keys generation in crypto in general (internet cut-off etc ...). 


## Archipel keys

The minimal nodes of an archipel is 3. You need to generate keys for this 3 nodes.

You can generate those keys [step-by-step](#step-by-step-keys-creation) to understand all steps and repeat 3 times for the 3 nodes.
There is also a [full steps commandline](full-steps-keys-creation) to generate quickly keys when you master it like ninja.

### step by step keys creation
```bash
subkey -n substrate generate > archipel-node1-sr25519.keys 
```

Note : the default keys generation is a sr25519. To be sure, you can also specify -s or --sr25519 option.

You will need the ed25519 keys format from the same seed. To do this we will first extract the phrase seed 12 mnemonic words of node 1 from archipel-node1-sr25519.keys file. then you keep the seed phrase in another file : archipel-node1.seed

```bash
cat archipel-node1-sr25519.keys | grep phrase | cut -d"\`" -f2 > archipel-node1.seed
```

now you can extract ed25519 keys format from phrase of archipel-node1.seed with :

```bash
subkey -n substrate --ed25519 inspect "$(<archipel-node1.seed)" > archipel-node1-ed25519.keys 
```

repeat the same commands above for node 2 and node 3. Or use this shortcut loop :

### Full steps keys creation

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


## Polkadot keys

We need to create : 
- 1 stash key
- 1 controler key
- 1 optional payout key
- 5 sessions keys 

## Polkadot Sessions Keys format explained

In orchestrator env you must valorize 5 sessions keys to be able to launch Polkadot validator node and validate the network.

```bash
POLKADOT_KEY_GRAN='april shift pupil quit ...'
POLKADOT_KEY_BABE='region run sunset rule ...'
POLKADOT_KEY_IMON='screen sustain clog husband ...'
POLKADOT_KEY_PARA='produce hover hurdle lobster ...'
POLKADOT_KEY_AUDI='oak tail stomach fluid ...'
```

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



