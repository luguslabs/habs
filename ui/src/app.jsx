import React from 'react';
require('semantic-ui-css/semantic.min.css');
import { Icon, Label, Header, Segment, Divider } from 'semantic-ui-react';
import { ReactiveComponent, If, Rspan } from 'oo7-react';
import {
	calls, runtime, chain, system, runtimeUp,
	addressBook, secretStore, metadata, nodeService
} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { Pretty } from './Pretty';
import { NodesCards } from './NodesCards';

export class App extends ReactiveComponent {
	constructor() {
		super([], { ensureRuntime: runtimeUp })

		// For debug only.
		window.runtime = runtime;
		window.secretStore = secretStore;
		window.addressBook = addressBook;
		window.chain = chain;
		window.calls = calls;
		window.system = system;
		window.that = this;
		window.metadata = metadata;
	}

	readyRender() {
		return (<div>
			<Heading />
			<ArchipelMasterSegment />
			<Divider hidden />
			<ArchipelNodesListSegment />
		</div>);
	}
}

class Heading extends React.Component {


	render() {
		return <div>
			<If
				condition={nodeService().status.map(x => !!x.connected)}
				then={<Label>Connected <Label.Detail>
					<Pretty className="value" value={nodeService().status.sub('connected')} />
				</Label.Detail></Label>}
				else={<Label>Not connected</Label>}
			/>
			<Label>Name <Label.Detail>
				<Pretty className="value" value={system.name} /> v<Pretty className="value" value={system.version} />
			</Label.Detail></Label>
			<Label>Chain <Label.Detail>
				<Pretty className="value" value={system.chain} />
			</Label.Detail></Label>
			<Label>Runtime <Label.Detail>
				<Pretty className="value" value={runtime.version.specName} /> v<Pretty className="value" value={runtime.version.specVersion} /> (
					<Pretty className="value" value={runtime.version.implName} /> v<Pretty className="value" value={runtime.version.implVersion} />
				)
			</Label.Detail></Label>
			<Label>Height <Label.Detail>
				<Pretty className="value" value={chain.height} /> (with <Pretty className="value" value={chain.lag} /> lag)
			</Label.Detail></Label>
			<Label>Authorities <Label.Detail>
				<Rspan className="value">{
					runtime.core.authorities.mapEach((a, i) => <Identicon key={i} account={a} size={10} />)
				}</Rspan>
			</Label.Detail></Label>
		</div>
	}
}

class ArchipelMasterSegment extends React.Component {
    constructor() {
        super()
    }

    render() {
	    let master = runtime.archipel.master;

        return <Segment style={{ margin: '1em' }} padded>
            <Header as='h2'>
                <Icon name='chess king' />
                <Header.Content>
                    Archipel Master<br />
                    <Header.Subheader><div className="master_wallet"><Identicon account={master} size={32} /> 
					<Pretty value={master} /></div></Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}></div>
        </Segment>
    }
}

class ArchipelNodesListSegment extends React.Component {
    constructor() {
        super()
    }

    render() {
		let master = runtime.archipel.master;
		let masterIndex = runtime.archipel.accountsIndex(master);

        return <Segment style={{ margin: '1em' }} padded>
            <Header as='h2'>
                <Header.Content>
                    Achipel Nodes
                    <Header.Subheader>Archipel has <Pretty value={runtime.archipel.accountsCount} /> nodes.</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}>
				<NodesCards count={runtime.archipel.accountsCount} master={master} masterIndex={masterIndex}/>
			</div>
        </Segment>
    }
}
