const { setNodeUri, setNetworkDefault } = require('oo7-substrate');

export function init() {

    let node = prompt("Give node URI:", "ws://127.0.0.1:9944/");

    setNodeUri([node]);
    setNetworkDefault(42);

}
