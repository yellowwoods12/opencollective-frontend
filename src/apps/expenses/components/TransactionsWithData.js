import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';

import withIntl from '../../../lib/withIntl';
import Error from '../../../components/Error';
import { getTransactionsQuery } from '../../../graphql/queries';

import Transactions from './Transactions';

class TransactionsWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    filters: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    dateDisplayType: PropTypes.oneOf(['date', 'interval']),
    data: PropTypes.object,
    fetchMore: PropTypes.func.isRequired,
    showCSVlink: PropTypes.bool,
  };

  constructor(props) {
    super(props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.props.LoggedInUser && nextProps.LoggedInUser) {
      return this.props.data.refetch();
    }
  }

  render() {
    const { data, LoggedInUser, collective, fetchMore, showCSVlink, filters } = this.props;

    if (data.error) {
      console.error('graphql error>>>', data.error.message);
      return <Error message="GraphQL error" />;
    }

    const transactions = data.allTransactions;

    return (
      <div className="TransactionsContainer">
        <Transactions
          collective={collective}
          transactions={transactions}
          refetch={data.refetch}
          fetchMore={fetchMore}
          filters={filters}
          LoggedInUser={LoggedInUser}
          showCSVlink={showCSVlink}
          dateDisplayType={this.props.dateDisplayType}
        />
      </div>
    );
  }
}

const TRANSACTIONS_PER_PAGE = 10;
export const addTransactionsData = graphql(getTransactionsQuery, {
  options(props) {
    return {
      variables: {
        CollectiveId: props.collective.id,
        offset: 0,
        limit: props.limit || TRANSACTIONS_PER_PAGE * 2,
      },
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allTransactions.length,
          limit: TRANSACTIONS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allTransactions: [...previousResult.allTransactions, ...fetchMoreResult.allTransactions],
          });
        },
      });
    },
  }),
});

export default addTransactionsData(withIntl(TransactionsWithData));
