import React, { useState } from "react";
import {
  Table,
  Grid,
  Icon,
  Button,
  Form,
  Input,
  Loader
} from "semantic-ui-react";
import TimeAgo from "react-timeago";
import config from "./config";
import useSWR, { mutate } from "swr";
import useAxios from "axios-hooks";
import fetch from "./libs/fetch";
import { useForm, Controller, ErrorMessage } from "react-hook-form";

function Main(props) {
  const defaultUrl = config.API_URL;
  const defaulPort = config.API_PORT;
  const URL_REGEXP = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/i;
  const PORT_REGEXP = /^\d+$/i;
  const [url, setUrl] = useState(config.API_URL);
  const [port, setPort] = useState(config.API_PORT);
  //fetch API with useSWR
  const { data, revalidate, error: fetchError } = useSWR(
    url + ":" + port,
    fetch,
    {
      // revalidate the data per second
      refreshInterval: 1000,
      onError: () => {}
    }
  );
  //post API with axios
  const [
    { data: postData, loading: postLoading, error: postError },
    executeServiceStart
  ] = useAxios(
    {
      url: url + ":" + port + "/service/start",
      method: "POST"
    },
    { manual: true }
  );
  // Form with useForm
  const { handleSubmit, control, reset, errors: formErrors } = useForm();

  const onSubmit = data => {
    if (data) {
      if (data.urlInput) {
        setUrl(data.urlInput);
      }
      if (data.portInput) {
        setPort(data.portInput);
      }
    }
  };

  return (
    <Grid.Column>
      <h1>API Config</h1>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Table celled striped size="small">
          <Table.Body>
            <Table.Row key="1">
              <Table.Cell>API Endpoint URL</Table.Cell>
              <Table.Cell>
                <Form.Field>
                  <Controller
                    as={Input}
                    name="urlInput"
                    rules={{ required: true, pattern: URL_REGEXP }}
                    control={control}
                    defaultValue={defaultUrl}
                  />
                  <ErrorMessage
                    errors={formErrors}
                    name="urlInput"
                    message="Wrong URL format"
                  />
                </Form.Field>
              </Table.Cell>
              <Table.Cell>
                <Button>Apply new URL</Button>
              </Table.Cell>
            </Table.Row>
            <Table.Row key="2">
              <Table.Cell>API Endpoint PORT</Table.Cell>
              <Table.Cell>
                <Form.Field>
                  <Controller
                    as={Input}
                    name="portInput"
                    rules={{ required: true, pattern: PORT_REGEXP }}
                    control={control}
                    defaultValue={defaulPort}
                  />
                  <ErrorMessage
                    errors={formErrors}
                    name="portInput"
                    message="Wrong Port format"
                  />
                </Form.Field>
              </Table.Cell>
              <Table.Cell>
                <Button>Apply new Port</Button>
              </Table.Cell>
            </Table.Row>
            <Table.Row key="3">
              <Table.Cell>API Status</Table.Cell>
              <Table.Cell>
                {data ? data.status : null}
                {fetchError
                  ? "Endpoint:" + url + ":" + port + " " + fetchError.toString()
                  : null}
              </Table.Cell>
              <Table.Cell>
                <Button
                  onClick={async () => {
                    reset({
                      urlInput: defaultUrl,
                      portInput: defaulPort
                    });
                  }}
                >
                  Reset Default Endpoint
                </Button>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Form>
      <h1>Archipel</h1>
      <Table celled striped size="small">
        <Table.Body>
          <Table.Row key="1">
            <Table.Cell>Orchestration Status</Table.Cell>
            <Table.Cell>
              {data ? JSON.stringify(data.orchestrationEnabled) : ""}
            </Table.Cell>
            <Table.Cell>
              {data ? (
                <Button
                  onClick={async () => {
                    let action = data.orchestrationEnabled
                      ? "/orchestration/disable"
                      : "/orchestration/enable";
                    await fetch(encodeURI(url + ":" + port + action));
                    revalidate();
                  }}
                >
                  {data.orchestrationEnabled
                    ? "Disable Orchestration"
                    : "Enable Orchestration"}
                </Button>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row key="2">
            <Table.Cell>Metric Status</Table.Cell>
            <Table.Cell>
              {data ? JSON.stringify(data.metricSendEnabled) : ""}
            </Table.Cell>
            <Table.Cell>
              {data ? (
                <Button
                  onClick={async () => {
                    let action = data.metricSendEnabled
                      ? "/metrics/disable"
                      : "/metrics/enable";
                    await fetch(encodeURI(url + ":" + port + action));
                    revalidate();
                  }}
                >
                  {data.metricSendEnabled
                    ? "Disable Metrics"
                    : "Enable Metrics"}
                </Button>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row key="3">
            <Table.Cell>Archipel chain Connected</Table.Cell>
            <Table.Cell>
              {data ? JSON.stringify(data.isConnected) : ""}
            </Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="4">
            <Table.Cell>Archipel Leader Node Address</Table.Cell>
            <Table.Cell>{data ? data.leader : ""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      <h1>Archipel Node</h1>
      <Table celled striped size="small">
        <Table.Body>
          <Table.Row key="1">
            <Table.Cell>Archipel Node Address</Table.Cell>
            <Table.Cell>{data ? data.orchestratorAddress : ""}</Table.Cell>
          </Table.Row>
          <Table.Row key="2">
            <Table.Cell>Archipel Peer Id</Table.Cell>
            <Table.Cell>{data ? data.peerId : ""}</Table.Cell>
          </Table.Row>
          <Table.Row key="3">
            <Table.Cell>Archipel Synch State</Table.Cell>
            <Table.Cell>
              {data ? JSON.stringify(data.synchState) : ""}
            </Table.Cell>
          </Table.Row>
          <Table.Row key="4">
            <Table.Cell>Archipel Peer Number</Table.Cell>
            <Table.Cell>{data ? data.peerNumber : ""}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      <h1>Service Node</h1>
      <Table celled striped size="small">
        <Table.Body>
          <Table.Row key="1">
            <Table.Cell>Service</Table.Cell>
            <Table.Cell>{data ? data.service : ""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="2">
            <Table.Cell>Service Ready To Operate</Table.Cell>
            <Table.Cell>
              {data ? JSON.stringify(data.isServiceReadyToStart) : ""}
            </Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="3">
            <Table.Cell>Current Service Mode</Table.Cell>
            <Table.Cell>{data ? data.serviceMode : ""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="4">
            <Table.Cell>Service Container Status</Table.Cell>
            <Table.Cell>{data ? data.serviceContainer : ""}</Table.Cell>
            <Table.Cell>
              {data &&
              (data.serviceContainer === "active" ||
                data.serviceContainer === "passive") ? (
                <Button
                  onClick={async () => {
                    let action = "/service/stop";
                    await fetch(encodeURI(url + ":" + port + action));
                    revalidate();
                  }}
                >
                  Stop Container
                </Button>
              ) : null}
              {data && !postLoading && data.serviceContainer === "none" ? (
                <div>
                  <Button
                    onClick={async () => {
                      await executeServiceStart({
                        data: { mode: "active" }
                      });
                      revalidate();
                    }}
                  >
                    Start Active Container
                  </Button>
                  <Button
                    onClick={async () => {
                      await executeServiceStart({
                        data: { mode: "passive" }
                      });
                      revalidate();
                    }}
                  >
                    Start Passive Container
                  </Button>
                </div>
              ) : null}
              {postLoading ? "Starting container..." : null}
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      <h1>Archipel Metrics</h1>
      <Table celled striped size="small">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Leader</Table.HeaderCell>
            <Table.HeaderCell>Node</Table.HeaderCell>
            <Table.HeaderCell>Metrics</Table.HeaderCell>
            <Table.HeaderCell>Heartbeats</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data
            ? data.metrics.map((metric, index) => (
                <Table.Row key={metric.wallet}>
                  <Table.Cell>
                    {metric.wallet === data.leader ? (
                      <Icon name="chess king" />
                    ) : (
                      ""
                    )}
                  </Table.Cell>
                  <Table.Cell>{metric.wallet}</Table.Cell>
                  <Table.Cell>{metric.metrics}</Table.Cell>
                  <Table.Cell>
                    <TimeAgo date={parseInt(metric.timestamp)} />
                  </Table.Cell>
                </Table.Row>
              ))
            : null}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}

export default function ArchipelModule(props) {
  return <Main {...props} />;
}
