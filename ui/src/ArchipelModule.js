import React, { useEffect, useState } from 'react';
import { Table, Grid, Icon } from 'semantic-ui-react';
import TimeAgo from 'react-timeago'

import { useSubstrate } from './substrate-lib';

function Main (props) {
  const { api } = useSubstrate();
  const [currentLeader, setCurrentLeader] = useState();

  const [accountsCount, setAccountsCount] = useState(0);

  const [accounts, setAccounts] = useState([]);

  const [metrics, setmetrics] = useState([]);

  const [heartbeats, setHeartbeats] = useState([]);

  useEffect(() => {
    let unsubscribe;
    api.query.archipelModule.leader(newLeader => {
      if (!newLeader.isEmpty) {
        setCurrentLeader(newLeader.toString());
      } else {
        setCurrentLeader('None');
      }
    }).then(unsub => {
      unsubscribe = unsub;
    })
      .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }, [api.query.archipelModule]);

  useEffect(() => {
    let unsubscribeAccountCount;
    let unsubscribeAccounts;
    let unsubscribeMetrics;
    let unsubscribeHeartbeats;
    api.query.archipelModule.accountsCount(count => {
      if (!count.isEmpty) {
        api.query.archipelModule.accounts.multi([...Array(count.toNumber()).keys()], accounts => {
          if (!accounts.isEmpty) {
            //valorize metrics
            api.query.archipelModule.metrics.multi(accounts, metrics => {
              setmetrics(metrics.map(metric => metric.toNumber()));
            }).then(unsub => {
              unsubscribeMetrics = unsub;
            })
            .catch(console.error);
            //valorize heartbeats
            api.query.archipelModule.heartbeats.multi(accounts, heartbeats => {
              setHeartbeats(heartbeats.map(heartbeat => heartbeat.toNumber()));
            }).then(unsub => {
              unsubscribeHeartbeats = unsub;
            })
            .catch(console.error);
            //valorize accounts 
            setAccounts(accounts.map(account => account.toString()));
          }
        }).then(unsub => {
          unsubscribeAccounts = unsub;
        })
          .catch(console.error);
        setAccountsCount(count.toNumber());
      }
    }).then(unsub => {
      unsubscribeAccountCount = unsub;
    })
      .catch(console.error);

    return () => unsubscribeAccountCount && unsubscribeAccountCount() &&
      unsubscribeAccounts && unsubscribeAccounts() &&
      unsubscribeMetrics && unsubscribeMetrics() &&
      unsubscribeHeartbeats && unsubscribeHeartbeats();;
  }, [api.query.archipelModule]);

  return (
    <Grid.Column>
      <h1>Archipel Leader</h1>
      {currentLeader}
      <h1>Archipel has {accountsCount} Nodes</h1>
      <Table celled striped size='small'>
        <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Leader</Table.HeaderCell>
          <Table.HeaderCell>Node</Table.HeaderCell>
          <Table.HeaderCell>Metrics</Table.HeaderCell>
          <Table.HeaderCell>Heartbeats</Table.HeaderCell>
        </Table.Row>
        </Table.Header>
        <Table.Body>{accounts.map((account, index) =>
          <Table.Row key={account}>
            <Table.Cell>{account === currentLeader ? <Icon name='chess king' /> : ''}</Table.Cell>
            <Table.Cell>{account}</Table.Cell>
            <Table.Cell>{metrics[index]}</Table.Cell>
            <Table.Cell>
            <TimeAgo date={heartbeats[index]} />
            </Table.Cell>
          </Table.Row>
        )}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}

export default function ArchipelModule (props) {
  const { api } = useSubstrate();
  return (api.query.system && api.query.archipelModule && api.query.archipelModule.leader
    ? <Main {...props} /> : null);
}
