import React from 'react';
import { Table, Grid, Icon, Button , Dimmer, Loader } from 'semantic-ui-react';
import TimeAgo from 'react-timeago'
import config from './config';
import useSWR, { mutate } from 'swr';
import useAxios from 'axios-hooks';
import fetch from './libs/fetch';

function Main (props) {
  const url = config.API_URL;
  const port = config.API_PORT;

  const loader = text => (
    <Dimmer active>
      <Loader size='small'>{text}</Loader>
    </Dimmer>
  );
  const { data, revalidate } = useSWR(url+":"+port, fetch, {
    // revalidate the data per second
    refreshInterval: 1000
  });

  const [ 
    { data: postData, loading: postLoading, error: postError },
    executeServiceStart
  ] = useAxios(
    {
      url: url+":"+port+'/service/start',
      method: 'POST'
    },
    { manual: true }
  );
  if (!data) return loader;
  return (
    <Grid.Column>

        <h1>Archipel</h1>
        <Table celled striped size='small'>
        <Table.Body>
          <Table.Row key="1">
            <Table.Cell>API Status</Table.Cell>
            <Table.Cell>{data?data.status:""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="2">
            <Table.Cell>Orchestration Status</Table.Cell>
            <Table.Cell>{data?JSON.stringify(data.orchestrationEnabled):""}</Table.Cell>
            <Table.Cell>
            {data?
                   <Button onClick={async () => {
                      let action =data.orchestrationEnabled?'/orchestration/disable':'/orchestration/enable';
                      await fetch(encodeURI(url+':'+port+action));
                      revalidate();
                      }}>
                      {data.orchestrationEnabled?"Disable Orchestration":"Enable Orchestration"}
                    </Button>
            :null}  
            </Table.Cell>
          </Table.Row>
          <Table.Row key="3">
            <Table.Cell>Metric Status</Table.Cell>
            <Table.Cell>{data?JSON.stringify(data.metricSendEnabled):""}</Table.Cell>
            <Table.Cell>
            {data?
                   <Button onClick={async () => {
                      let action =data.metricSendEnabled?'/metrics/disable':'/metrics/enable';
                      await fetch(encodeURI(url+':'+port+action));
                      revalidate();
                      }}>
                      {data.metricSendEnabled?"Disable Metrics":"Enable Metrics"}
                    </Button>
            :null}  
            </Table.Cell>
          </Table.Row>   
          <Table.Row key="4">
            <Table.Cell>Archipel chain Connected</Table.Cell>
            <Table.Cell>{data?JSON.stringify(data.isConnected):""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="5">
            <Table.Cell>Archipel Leader Node Address</Table.Cell>
            <Table.Cell>{data?data.leader:""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      <h1>Archipel Node</h1>
      <Table celled striped size='small'>
        <Table.Body>
          <Table.Row key="1">
            <Table.Cell>Archipel Node Address</Table.Cell>
            <Table.Cell>{data?data.orchestratorAddress:""}</Table.Cell>
          </Table.Row>
          <Table.Row key="2">
            <Table.Cell>Archipel Peer Id</Table.Cell>
            <Table.Cell>{data?data.peerId:""}</Table.Cell>
          </Table.Row>
          <Table.Row key="3">
            <Table.Cell>Archipel Synch State</Table.Cell>
            <Table.Cell>{data?JSON.stringify(data.synchState):""}</Table.Cell>
          </Table.Row>
          <Table.Row key="4">
            <Table.Cell>Archipel Peer Number</Table.Cell>
            <Table.Cell>{data?data.peerNumber:""}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      <h1>Service Node</h1>
      <Table celled striped size='small'>
        <Table.Body>
          <Table.Row key="1">
            <Table.Cell>Service</Table.Cell>
            <Table.Cell>{data?data.service:""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="2">
            <Table.Cell>Service Ready To Operate</Table.Cell>
            <Table.Cell>{data?JSON.stringify(data.isServiceReadyToStart):""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="3">
            <Table.Cell>Current Service Mode</Table.Cell>
            <Table.Cell>{data?data.serviceMode:""}</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
          <Table.Row key="4">
            <Table.Cell>Service Container Status</Table.Cell>
            <Table.Cell>{data?data.serviceContainer:""}</Table.Cell>
            <Table.Cell>
            {(data && (data.serviceContainer === 'active' ||data.serviceContainer === 'passive'))?
                   <Button onClick={async () => {
                      let action ='/service/stop';
                      await fetch(encodeURI(url+':'+port+action));
                      revalidate();
                      }}>
                      Stop Container
                    </Button>
            :null}  
            {(data && !postLoading && data.serviceContainer === 'none')?
                  <div>
                   <Button onClick={async () => {
                      await executeServiceStart({
                        data: {"mode":"active"}
                      })
                      revalidate();
                      }}>
                      Start Active Container
                    </Button>
                    <Button onClick={async () => {
                      await executeServiceStart({
                        data: {"mode":"passive"}
                      })
                      revalidate();
                      }}>
                      Start Passive Container
                    </Button>
                    </div>
            :null} 
            {postLoading?"Starting container...":null}
            </Table.Cell>
          </Table.Row> 
        </Table.Body>
      </Table>
      <h1>Archipel Metrics</h1>
      <Table celled striped size='small'>
        <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Leader</Table.HeaderCell>
          <Table.HeaderCell>Node</Table.HeaderCell>
          <Table.HeaderCell>Metrics</Table.HeaderCell>
          <Table.HeaderCell>Heartbeats</Table.HeaderCell>
        </Table.Row>
        </Table.Header>
        <Table.Body>{data?data.metrics.map((metric, index) =>
          <Table.Row key={metric.wallet}>
            <Table.Cell>{metric.wallet === data.leader ? <Icon name='chess king' /> : ''}</Table.Cell>
            <Table.Cell>{metric.wallet}</Table.Cell>
            <Table.Cell>{metric.metrics}</Table.Cell>
            <Table.Cell>
            <TimeAgo date={parseInt(metric.timestamp)} />
            </Table.Cell>
          </Table.Row>
        ):null}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}

export default function ArchipelModule (props) {
  return (<Main {...props} />);
}
