import React, { useEffect, useState } from 'react';
import { Table, Grid, Icon } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';

function Main (props) {
  const { api } = useSubstrate();
  const [currentMaster, setCurrentMaster] = useState();

  const [accountsCount, setAccountsCount] = useState(0);

  const [accounts, setAccounts] = useState([]);

  const [metrics, setmetrics] = useState([]);

  useEffect(() => {
    let unsubscribe;
    api.query.archipelModule.master(newMaster => {
      if (!newMaster.isEmpty) {
        setCurrentMaster(newMaster.toString());
      } else {
        setCurrentMaster('Service down. No master');
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
    api.query.archipelModule.accountsCount(count => {
      if (!count.isEmpty) {
        api.query.archipelModule.accounts.multi([...Array(count.toNumber()).keys()], accounts => {
          if (!accounts.isEmpty) {
            api.query.archipelModule.metrics.multi(accounts, metrics => {
              setmetrics(metrics.map(metric => metric.toNumber()));
            }).then(unsub => {
              unsubscribeMetrics = unsub;
            })
              .catch(console.error);
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
      unsubscribeMetrics && unsubscribeMetrics();
  }, [api.query.archipelModule]);

  return (
    <Grid.Column>
      <h1>Archipel Master</h1>
      {currentMaster}
      <h1>Archipel has {accountsCount} Nodes</h1>
      <Table celled striped size='small'>
        <Table.Body>{accounts.map((account, index) =>
          <Table.Row key={account}>
            <Table.Cell>{account === currentMaster ? <Icon name='chess king' /> : ''}</Table.Cell>
            <Table.Cell>{account}</Table.Cell>
            <Table.Cell>{metrics[index]}</Table.Cell>
          </Table.Row>
        )}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}

export default function ArchipelModule (props) {
  const { api } = useSubstrate();
  return (api.query.archipelModule && api.query.archipelModule.master
    ? <Main {...props} /> : null);
}
