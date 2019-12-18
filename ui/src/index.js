import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import {render} from 'react-dom';
import {App} from './app.jsx';
const { setNodeUri, setNetworkDefault } = require('oo7-substrate');

setNodeUri(['ws://127.0.0.1:9944/']);

setNetworkDefault(42);

render(<App/>, document.getElementById('app'));
