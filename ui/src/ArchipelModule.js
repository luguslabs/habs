import React, { useState } from "react";
import {
  Table,
  Grid,
  Icon,
  Button,
  Form,
  Input,
  Header,
  Segment,
  Statistic,
  Progress,
  Message,
  Radio,
  Label
} from "semantic-ui-react";
import TimeAgo from "react-timeago";
import useSWR from "swr";
import useAxios from "axios-hooks";
import fetch from "./libs/fetch";
import { useForm, Controller } from "react-hook-form";
import { useLocalStorage } from "@rehooks/local-storage";

function Main(props) {
  const defaultUrl = props.defaultUrl;
  const URL_REGEXP = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/i;
  const [urlSorage, setUrlStorage, clearUrlStorage] = useLocalStorage("url");
  const [url, setUrl] = useState(urlSorage ? urlSorage : defaultUrl);

  //fetch API with useSWR
  const { data, revalidate, error: fetchError } = useSWR(url, fetch, {
    // revalidate the data per second
    refreshInterval: 1000,
    onError: () => {}
  });
  //post API with axios
  const [
    { loading: postLoading, error: postError },
    executeServiceStart
  ] = useAxios(
    {
      url: url + "/service/start",
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
        setUrlStorage(data.urlInput);
      }
    }
  };
  return (
    <div>
      <Grid columns={1} container stackable>
        <Grid.Row>
          <Grid.Column></Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Header as="h2">
              <Icon name="sitemap" />
              <Header.Content>Archipel Dashboard</Header.Content>
            </Header>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Segment>
              <Grid>
                <Grid.Row>
                  <Grid.Column className="height wide">
                    <Form error onSubmit={handleSubmit(onSubmit)}>
                      <Form.Group>
                        <Form.Field inline>
                          <Label pointing="right">API Endpoint</Label>
                          <Controller
                            as={Input}
                            name="urlInput"
                            rules={{ required: true, pattern: URL_REGEXP }}
                            control={control}
                            defaultValue={url}
                          />
                        </Form.Field>
                        <Form.Button content="Apply" />
                        <Form.Button
                          content="Reset "
                          onClick={async () => {
                            clearUrlStorage();
                            reset({
                              urlInput: defaultUrl
                            });
                            setUrl(defaultUrl);
                          }}
                        />
                      </Form.Group>
                      {formErrors.urlInput || fetchError ? (
                        <Message
                          error
                          content={
                            formErrors.urlInput
                              ? "Wrong URL format"
                              : fetchError.toString()
                          }
                        />
                      ) : null}
                    </Form>
                  </Grid.Column>
                  <Grid.Column className="height wide"></Grid.Column>
                </Grid.Row>
              </Grid>
              {data && data.status === "200" ? (
                <Progress
                  active
                  color="green"
                  percent={100}
                  attached="bottom"
                />
              ) : (
                <Progress color="red" percent={100} attached="bottom" />
              )}
            </Segment>
          </Grid.Column>
        </Grid.Row>
        {data
          ? data.metrics.map((metric, index) => (
              <Grid.Row>
                <Grid.Column>
                  <Segment raised>
                    <Grid columns={4}>
                      <Grid.Row>
                        <Grid.Column className="two wide">
                          {data.orchestratorAddress === metric.wallet ? (
                            <Label color="green" ribbon>
                              <Icon name="disk" />
                              Connected
                            </Label>
                          ) : null}
                        </Grid.Column>
                        <Grid.Column className="six wide center aligned">
                          <Statistic vertical size="tiny">
                            <Statistic.Value>
                              {metric.wallet === data.leader
                                ? "Active "
                                : "Passive "}
                              Node
                            </Statistic.Value>
                            <Statistic.Label>{metric.wallet}</Statistic.Label>
                          </Statistic>
                        </Grid.Column>
                        <Grid.Column className="six wide center aligned">
                          <Statistic vertical size="tiny">
                            <Statistic.Value>
                              <Icon name="heartbeat" />{" "}
                              <TimeAgo date={parseInt(metric.timestamp)} />
                            </Statistic.Value>
                            <Statistic.Label>Last Heartbeat</Statistic.Label>
                          </Statistic>
                        </Grid.Column>
                        <Grid.Column className="two wide">
                          {metric.wallet === data.leader ? (
                            <Label color="orange" ribbon="right" size="large">
                              <Icon name="winner" /> Active
                            </Label>
                          ) : (
                            <Label color="grey" ribbon="right" size="large">
                              <Icon name="bed" /> Passive
                            </Label>
                          )}
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Segment>
                </Grid.Column>
              </Grid.Row>
            ))
          : null}
        <Grid.Row>
          <Grid.Column>
            <Table celled fixed>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>
                    {data ? (
                      <Label color="green" ribbon>
                        <Icon name="disk" />
                        Node Administration
                      </Label>
                    ) : (
                      "Node Administration"
                    )}
                  </Table.HeaderCell>
                  <Table.HeaderCell></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>Orchestration</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      <Radio
                        onClick={async () => {
                          const action =
                            JSON.stringify(data.orchestrationEnabled) === "true"
                              ? "/orchestration/disable"
                              : "/orchestration/enable";
                          await fetch(encodeURI(url + action));
                          revalidate();
                        }}
                        toggle
                        checked={
                          JSON.stringify(data.orchestrationEnabled) === "true"
                        }
                      />
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Heartbeat Send</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      <Radio
                        onClick={async () => {
                          const action =
                            JSON.stringify(data.metricSendEnabledAdmin) ===
                            "true"
                              ? "/metrics/disable"
                              : "/metrics/enable";
                          await fetch(encodeURI(url + action));
                          revalidate();
                        }}
                        toggle
                        checked={
                          JSON.stringify(data.metricSendEnabledAdmin) === "true"
                        }
                      />
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row key="5">
                  <Table.Cell>Heartbeat By Algorithm</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.metricSendEnabled) === "true" ? (
                        <Icon name="checkmark" />
                      ) : (
                        <Icon name="close" />
                      )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Current Node Address</Table.Cell>
                  <Table.Cell>
                    {data ? data.orchestratorAddress : ""}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Leader Node Address</Table.Cell>
                  <Table.Cell>{data ? data.leader : ""}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Connected To Chain</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.isConnected) === "true" ? (
                        <Icon name="checkmark" />
                      ) : (
                        <Icon name="close" />
                      )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Synch State</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.synchState) === "false" ? (
                        <Icon name="checkmark" />
                      ) : (
                        <Icon name="sync" />
                      )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Peer Id</Table.Cell>
                  <Table.Cell>{data ? data.peerId : ""}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Peer Number</Table.Cell>
                  <Table.Cell>{data ? data.peerNumber : ""}</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Table celled fixed>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>
                  {data ? (
                      <Label color="green" ribbon>
                        <Icon name="disk" />
                        Service Administration
                      </Label>
                    ) : (
                      "Service Administration"
                    )}
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    {data &&
                    (data.serviceContainer === "active" ||
                      data.serviceContainer === "passive") ? (
                      <Button
                        onClick={async () => {
                          let action = "/service/stop";
                          await fetch(encodeURI(url + action));
                          revalidate();
                        }}
                      >
                        Stop Service Container
                      </Button>
                    ) : null}
                    {data &&
                    !postLoading &&
                    data.serviceContainer === "none" ? (
                      <div>
                        <Button
                          onClick={async () => {
                            await executeServiceStart({
                              data: { mode: "active" }
                            });
                            revalidate();
                          }}
                        >
                          Start Active Service Container
                        </Button>
                        <Button
                          onClick={async () => {
                            await executeServiceStart({
                              data: { mode: "passive" }
                            });
                            revalidate();
                          }}
                        >
                          Start Passive Service Container
                        </Button>
                      </div>
                    ) : null}
                    {postLoading ? "Starting container..." : null}
                    {postError ? postError.toString() : null}
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>Service</Table.Cell>
                  <Table.Cell>{data ? data.service : ""}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Service Ready To Operate</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.isServiceReadyToStart) === "true" ? (
                        <Icon name="checkmark" />
                      ) : (
                        <Icon name="close" />
                      )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Current Service Mode</Table.Cell>
                  <Table.Cell>
                    {data && data.serviceMode === "passive" ? (
                      <Icon name="bed" />
                    ) : null}
                    {data && data.serviceMode === "active" ? (
                      <Icon name="winner" />
                    ) : null}
                    {data && data.serviceMode === "none" ? (
                      <Icon name="close" />
                    ) : null}
                    {data && data.serviceMode ? data.serviceMode : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Service Container Status</Table.Cell>
                  <Table.Cell>
                    {data && data.serviceContainer === "passive" ? (
                      <Icon name="bed" />
                    ) : null}
                    {data && data.serviceContainer === "active" ? (
                      <Icon name="winner" />
                    ) : null}
                    {data && data.serviceContainer === "none" ? (
                      <Icon name="close" />
                    ) : null}
                    {data && data.serviceContainer
                      ? data.serviceContainer
                      : null}
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
}

export default function ArchipelModule(props) {
  return <Main {...props} />;
}
