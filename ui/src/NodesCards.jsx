import React from 'react';
import { ReactiveComponent } from 'oo7-react';
import { Card } from 'semantic-ui-react';
import { Pretty } from './Pretty';
import { runtime, pretty } from 'oo7-substrate';
import Identicon from 'polkadot-identicon';

export class NodesCards extends ReactiveComponent {
	constructor () {
        super(["count", "master", "masterIndex"])

    }

    readyRender () {
        return (<Card.Group>
            {Array.from(Array(this.state.count).fill(0).keys()).map(i => {
                let account = runtime.archipelModule.accounts(i);

                return (
                <Card key={i}>
                    <div className="nodes_ident">
                        <Identicon account={account} size={120} />
                    
                    </div>
                    <Card.Content>
                        <Card.Header>
                            Node <Pretty
                                value={i+1}
                            />
                            {(i == this.state.masterIndex) ? " - Master" : ""}
                        </Card.Header>
                        <Card.Meta className="no_overflow">
                            <b>Address</b>: <Pretty value={account} />
                        </Card.Meta>
                        <Card.Description>
                            <b>Metrics</b>: <Pretty value={runtime.archipelModule.metrics(account)} />
                        </Card.Description>
                    </Card.Content>
                </Card> 
            )})}
        </Card.Group>);
    }
}
