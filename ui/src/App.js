import React, { createRef } from "react";
import { Container, Grid } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import config from "./config";
import ArchipelModule from "./ArchipelModule";

function Main() {
  const contextRef = createRef();

  const defaultUrl =
    process.env.NODE_ENV === "production"
      ? config.API_URL
      : process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL
      : config.API_URL;

  const defaulPort =
    process.env.NODE_ENV === "production"
      ? config.API_PORT
      : process.env.REACT_APP_API_PORT
      ? process.env.REACT_APP_API_PORT
      : config.API_PORT;

  return (
    <div ref={contextRef}>
      <Container>
        <Grid stackable columns="equal">
          <Grid.Row>
            <ArchipelModule defaultUrl={defaultUrl} defaulPort={defaulPort} />
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
}

export default function App() {
  return <Main />;
}
