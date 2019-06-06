import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import Error from '../../../components/Error';
import withIntl from '../../../lib/withIntl';
import Order from './Order';

class OrderWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    view: PropTypes.string, // "compact" for homepage (can't edit order, don't show header), "summary" for list view, "details" for details view
    LoggedInUser: PropTypes.object,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, LoggedInUser, collective, view } = this.props;

    if (data.error) {
      console.error('graphql error>>>', data.error.message);
      return <Error message="GraphQL error" />;
    }

    if (data.loading) {
      return (
        <div>
          <FormattedMessage id="loading" defaultMessage="loading" />
        </div>
      );
    }

    const order = data.Order;

    return (
      <div className="OrderWithData">
        <style jsx>
          {`
            .comments {
              margin-top: 3rem;
            }
          `}
        </style>
        <Order
          key={order.id}
          collective={collective}
          order={order}
          view={view}
          editable={true}
          LoggedInUser={LoggedInUser}
        />
      </div>
    );
  }
}

const getOrderQuery = gql`
  query Order($id: Int!) {
    Order(id: $id) {
      id
      description
      status
      createdAt
      updatedAt
      totalAmount
      currency
      publicMessage
      collective {
        id
        slug
        currency
        name
        host {
          id
          slug
        }
        stats {
          id
          balance
        }
      }
      fromCollective {
        id
        type
        name
        slug
        image
      }
    }
  }
`;

export const addOrderData = graphql(getOrderQuery);
export default addOrderData(withIntl(OrderWithData));
