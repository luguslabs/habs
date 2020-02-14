const PeerId = require('peer-id')

const main = async function(a, b) {    
    const id = await PeerId.createFromHexString(process.argv[2],{ bits: 1024, keyType: 'rsa' });
    //console.log(JSON.stringify(id.toJSON(), null, 2));
    console.log("PEER_ID="+id.toB58String());
    console.log("NODE_KEY="+id.toHexString());  
}
main();