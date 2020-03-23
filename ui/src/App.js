import React, { createRef } from "react";
import { Container, Grid } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import config from "./config";
import ArchipelModule from "./ArchipelModule";

function Main() {
  const contextRef = createRef();

  const defaultUrl = config.API_URL;

  return (
    <div ref={contextRef}>
      <Container>
        <Grid stackable columns="equal">
          <Grid.Row>
            <ArchipelModule defaultUrl={defaultUrl} />
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
}

export default function App() {
  return <Main />;
}
