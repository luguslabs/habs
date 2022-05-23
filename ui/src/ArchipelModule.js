import React, { useState } from 'react';
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
  Label,
  Loader,
  Confirm
} from 'semantic-ui-react';
import useSWR from 'swr';
import useAxios from 'axios-hooks';
import fetch from './libs/fetch';
import { useForm, Controller } from 'react-hook-form';
import { useLocalStorage } from '@rehooks/local-storage';

function Main (props) {
  const defaultUrl = props.defaultUrl;
  const [urlSorage, setUrlStorage, clearUrlStorage] = useLocalStorage('url');
  const [url, setUrl] = useState(urlSorage || defaultUrl);
  const [warningOrchestratorPopup, setWarningOrchestratorPopup] = useState(
    false
  );
  const [warningHeartbeatPopup, setWarningHeartbeatPopup] = useState(false);
  const [
    warningStopServiceContainer,
    setWarningStopServiceContainer
  ] = useState(false);

  // fetch API with useSWR
  const { data, revalidate, error: fetchError } = useSWR(url, fetch, {
    // revalidate the data per second
    refreshInterval: 1000,
    onError: () => {}
  });
  // post API with axios
  const [
    { loading: postLoading, error: postError },
    executeServiceStart
  ] = useAxios(
    {
      url: url + '/service/start',
      method: 'POST'
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
              <Header.Content>
                Archipel Dashboard{data ? ` - ${data.archipelName}` : ''}
              </Header.Content>
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
                            rules={{ required: true }}
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
                              ? 'API Endpoint required'
                              : fetchError.toString()
                          }
                        />
                      ) : null}
                    </Form>
                  </Grid.Column>
                  <Grid.Column className="height wide"></Grid.Column>
                </Grid.Row>
              </Grid>
              {data && data.status === '200' ? (
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
        {data &&
        data.status === '200' &&
        data.heartbeats &&
        data.heartbeats.length === 0 ? (
            <Grid.Row>
              <Grid.Column>
                <Segment raised>
                  <Grid columns={3}>
                    <Grid.Row>
                      <Grid.Column className="two wide"></Grid.Column>
                      <Grid.Column className="twelve wide center aligned">
                        <Loader as="h2" active inline indeterminate>
                        Fetching Archipel Heartbeats. Please wait...
                        </Loader>
                      </Grid.Column>
                      <Grid.Column className="two wide"></Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          ) : null}
        {data &&
        data.status === '200' &&
        data.heartbeats
          ? data.heartbeats.map((heartbeat, index) => (
            <Grid.Row>
              <Grid.Column>
                <Segment raised>
                  <Grid columns={4}>
                    <Grid.Row>
                      <Grid.Column className="two wide">
                        {data.orchestratorAddress === heartbeat.wallet ? (
                          <Label color="green" ribbon>
                            <Icon name="disk" />
                              Current Node
                          </Label>
                        ) : null}
                      </Grid.Column>
                      <Grid.Column className="six wide center aligned">
                        <Statistic vertical size="tiny">
                          <Statistic.Value>
                            {heartbeat.name ? heartbeat.name : ''}
                          </Statistic.Value>
                          <Statistic.Label>{heartbeat.wallet}</Statistic.Label>
                        </Statistic>
                      </Grid.Column>
                      <Grid.Column className="six wide center aligned">
                        <Statistic vertical size="tiny">
                          <Statistic.Value>
                            <Icon name="heartbeat" />
                            {(heartbeat.blockNumber && data.bestNumber) ? (' ' + parseInt(data.bestNumber) - parseInt(heartbeat.blockNumber) + 'Blocks Ago') : ''}
                          </Statistic.Value>
                          <Statistic.Label>Last Heartbeat </Statistic.Label>
                        </Statistic>
                      </Grid.Column>
                      <Grid.Column className="two wide">
                        {heartbeat.wallet === data.leader ? (
                          <Label color="orange" ribbon="right" size="large">
                            <Icon name="winner" /> Active
                          </Label>
                        ) : null}
                        {(heartbeat.wallet !== data.leader && heartbeat.nodeStatus && parseInt(heartbeat.nodeStatus) === 2) ? (
                          <Label color="grey" ribbon="right" size="large">
                            <Icon name="bed" /> Passive
                          </Label>
                        ) : null}
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
                      'Node Administration'
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
                      JSON.stringify(data.orchestrationEnabled) === 'false' ? (
                        <Radio
                          onClick={async () => {
                            await fetch(
                              encodeURI(url + '/orchestration/enable')
                            );
                            revalidate();
                          }}
                          toggle
                          checked={false}
                        />
                      ) : (
                        <div>
                          <Radio
                            toggle
                            checked={true}
                            onClick={async () => {
                              setWarningOrchestratorPopup(true);
                            }}
                          />
                          <Confirm
                            open={warningOrchestratorPopup}
                            header="Dangerous Action"
                            content="Deactivate orchestration can lead to unstable Archipel High Availability state. Are you sure to deactivate it?"
                            cancelButton="No, I'am just a deckhand"
                            confirmButton="Yes! I'am corsair"
                            onConfirm={async () => {
                              await fetch(
                                encodeURI(url + '/orchestration/disable')
                              );
                              setWarningOrchestratorPopup(false);
                              revalidate();
                            }}
                            onCancel={async () => {
                              setWarningOrchestratorPopup(false);
                              revalidate();
                            }}
                          />
                        </div>
                      )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Heartbeat Send</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.heartbeatSendEnabledAdmin) ===
                      'false' ? (
                          <Radio
                            onClick={async () => {
                              await fetch(encodeURI(url + '/heartbeats/enable'));
                              revalidate();
                            }}
                            toggle
                            checked={false}
                          />
                        ) : (
                          <div>
                            <Radio
                              toggle
                              checked={true}
                              onClick={async () => {
                                setWarningHeartbeatPopup(true);
                              }}
                            />
                            <Confirm
                              open={warningHeartbeatPopup}
                              header="Dangerous Action"
                              content="Deactivate heartbeat can lead to unstable Archipel High Availability state. Are you sure to deactivate it?"
                              cancelButton="No, I'am just a deckhand"
                              confirmButton="Yes! I'am corsair"
                              onConfirm={async () => {
                                await fetch(encodeURI(url + '/heartbeats/disable'));
                                setWarningHeartbeatPopup(false);
                                revalidate();
                              }}
                              onCancel={async () => {
                                setWarningHeartbeatPopup(false);
                                revalidate();
                              }}
                            />
                          </div>
                        )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row key="5">
                  <Table.Cell>Heartbeat By Algorithm</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.heartbeatSendEnabled) === 'true' ? (
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
                    {data ? data.orchestratorAddress : ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Leader Node Address</Table.Cell>
                  <Table.Cell>{data ? data.leader : ''}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Connected To Chain</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.isConnected) === 'true' ? (
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
                      JSON.stringify(data.synchState) === 'false' ? (
                        <Icon name="checkmark" />
                      ) : (
                        <Icon name="sync" />
                      )
                    ) : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Peer Id</Table.Cell>
                  <Table.Cell>{data ? data.peerId : ''}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Peer Number</Table.Cell>
                  <Table.Cell>{data ? data.peerNumber : ''}</Table.Cell>
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
                      'Service Administration'
                    )}
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    {data &&
                    (data.serviceContainer === 'active' ||
                      data.serviceContainer === 'passive') ? (
                        <div>
                          <Button
                            onClick={async () => {
                              setWarningStopServiceContainer(true);
                            }}
                          >
                          Stop Service Container
                          </Button>
                          <Confirm
                            open={warningStopServiceContainer}
                            header="Dangerous Action"
                            content="Stopping Service container can lead to unstable Archipel High Availability state. Are you sure to stop it?"
                            cancelButton="No, I'am just a deckhand"
                            confirmButton="Yes! I'am corsair"
                            onConfirm={async () => {
                              await fetch(encodeURI(url + '/service/stop'));
                              setWarningStopServiceContainer(false);
                              revalidate();
                            }}
                            onCancel={async () => {
                              setWarningStopServiceContainer(false);
                              revalidate();
                            }}
                          />
                        </div>
                      ) : null}
                    {data &&
                    !postLoading &&
                    data.serviceContainer === 'none'? (
                        <div>
                          <Button
                            onClick={async () => {
                              await executeServiceStart({
                                data: { mode: 'passive' }
                              });
                              revalidate();
                            }}
                          >
                          Start Passive Service Container
                          </Button>
                        </div>
                      ) : null}
                    {postLoading ? 'Starting container...' : null}
                    {postError ? postError.toString() : null}
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>Service</Table.Cell>
                  <Table.Cell>{data ? data.service : ''}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Service Ready To Operate</Table.Cell>
                  <Table.Cell>
                    {data ? (
                      JSON.stringify(data.isServiceReadyToStart) === 'true' ? (
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
                    {data && data.serviceMode === 'passive' ? (
                      <Icon name="bed" />
                    ) : null}
                    {data && data.serviceMode === 'active' ? (
                      <Icon name="winner" />
                    ) : null}
                    {data && data.serviceMode === 'none' ? (
                      <Icon name="close" />
                    ) : null}
                    {data && data.serviceMode ? data.serviceMode : null}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Service Container Status</Table.Cell>
                  <Table.Cell>
                    {data && data.serviceContainer === 'passive' ? (
                      <Icon name="bed" />
                    ) : null}
                    {data && data.serviceContainer === 'active' ? (
                      <Icon name="winner" />
                    ) : null}
                    {data && data.serviceContainer === 'none' ? (
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

export default function ArchipelModule (props) {
  return <Main {...props} />;
}
