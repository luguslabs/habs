import React, { createRef } from 'react';
import { Container, Dimmer, Loader, Grid } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import { SubstrateContextProvider, useSubstrate } from './substrate-lib';
import { DeveloperConsole } from './substrate-lib/components';
import ArchipelModule from './ArchipelModule';

function Main () {
  const { apiState } = useSubstrate();
  const loader = text => (
    <Dimmer active>
      <Loader size='small'>{text}</Loader>
    </Dimmer>
  );

  if (apiState === 'ERROR') return loader('Error connecting to the blockchain');
  else if (apiState !== 'READY') return loader('Connecting to the blockchain');

  const contextRef = createRef();

  return (
    <div ref={contextRef}>
      <Container>
        <Grid stackable columns='equal'>
          <Grid.Row>
            <ArchipelModule />
          </Grid.Row>
        </Grid>
        <DeveloperConsole />
      </Container>
    </div>
  );
}

export default function App () {
  return (
    <SubstrateContextProvider>
      <Main />
    </SubstrateContextProvider>
  );
}
