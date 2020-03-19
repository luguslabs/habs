import React, { createRef } from 'react';
import { Container, Grid } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import ArchipelModule from './ArchipelModule';

function Main () {

  const contextRef = createRef();

  return (
    <div ref={contextRef}>
      <Container>
        <Grid stackable columns='equal'>
          <Grid.Row>
            <ArchipelModule />
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
}

export default function App () {
  return (
      <Main />
  );
}
