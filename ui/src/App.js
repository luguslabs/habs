import React from "react";
import "semantic-ui-css/semantic.min.css";
import config from "./config";
import ArchipelModule from "./ArchipelModule";

function Main() {
  const defaultUrl = config.API_URL;
  return (
    <div>
      <ArchipelModule defaultUrl={defaultUrl} />
    </div>
  );
}
export default function App() {
  return <Main />;
}
