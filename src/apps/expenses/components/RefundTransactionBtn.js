import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import withIntl from '../../../lib/withIntl';
import { getTransactionsQuery, transactionFields } from '../../../graphql/queries';

import SmallButton from '../../../components/SmallButton';

class RefundTransactionBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    isRefund: PropTypes.bool,
    CollectiveId: PropTypes.number.isRequired,
    refundTransaction: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.setShowingState = this.setShowingState.bind(this);

    const canRefund = !props.isRefund;
    this.state = {
      showing: {
        canRefund,
        refunded: props.isRefund,
        confirmRefund: false,
        refunding: false,
      },
    };
  }

  /** Set state received as true and all the other ones to false.
   *
   * This function should be called with a single state. An exception
   * will be thrown if more than one state is passed.
   */
  setShowingState({ canRefund, confirmRefund, refunded, refunding }) {
    if (canRefund && confirmRefund && refunded && refunding) {
      throw new Error("Can't set more than one state to true");
    }
    this.setState({
      showing: {
        canRefund: !!canRefund,
        confirmRefund: !!confirmRefund,
        refunded: !!refunded,
        refunding: !!refunding,
      },
    });
  }

  /** Fires off the actual refund action.
   *
   * This function sets the state to `refunding` before calling the
   * refund graphql mutation and then it sets the state to `refunded`
   * after it's all done.
   */
  async onClickRefund() {
    this.setShowingState({ refunding: true });
    try {
      await this.props.refundTransaction(this.props.id);
    } finally {
      this.setShowingState({ refunded: true });
    }
  }

  render() {
    return (
      <div>
        <style jsx>
          {`
            .confirmation {
              border-top: solid 1px #ddd;
              margin: 10px 0;
              padding: 10px 0;
            }
            .confirmation strong {
              display: block;
              padding-bottom: 5px;
            }
            .confirmation-buttons {
              display: flex;
              flex-direction: row;
              justify-content: flex-start;
            }
            .confirmation-buttons .SmallButton.refund {
              margin-right: 10px;
            }
          `}
        </style>

        {/* Already refunded so we don't really don't need to show
            anything */}
        {this.state.showing.refunded && <div />}

        {/* User just pressed refunding. Display loading spinner */}
        {this.state.showing.refunding && (
          <div className="confirmation">
            <em>Refunding</em>
          </div>
        )}

        {this.state.showing.canRefund && (
          <div className="confirmation">
            <div className="confirmation-buttons">
              <SmallButton
                className="refund"
                bsStyle="danger"
                bsSize="xsmall"
                onClick={() => this.setShowingState({ confirmRefund: true })}
              >
                <FormattedMessage id="transaction.refund.btn" defaultMessage="refund" />
              </SmallButton>
            </div>
          </div>
        )}

        {this.state.showing.confirmRefund && (
          <div className="confirmation">
            <strong>Do you really want to refund this transaction?</strong>
            <div className="confirmation-buttons">
              <SmallButton className="refund" bsStyle="danger" bsSize="xsmall" onClick={() => this.onClickRefund()}>
                <FormattedMessage id="transaction.refund.yes.btn" defaultMessage="Yes, refund!" />
              </SmallButton>
              <SmallButton
                className="no"
                bsStyle="primary"
                bsSize="xsmall"
                onClick={() => this.setShowingState({ canRefund: true })}
              >
                <FormattedMessage id="transaction.refund.no.btn" defaultMessage="no" />
              </SmallButton>
            </div>
          </div>
        )}
      </div>
    );
  }
}

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const refundTransactionQuery = gql`
  mutation refundTransaction($id: Int!) {
    refundTransaction(id: $id) {
      id
      refundTransaction {
        ${transactionFields}
        refundTransaction {
          ${transactionFields}
        }
      }
    }
  }
`;
/* eslint-enable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const addMutation = graphql(refundTransactionQuery, {
  props: ({ ownProps, mutate }) => ({
    refundTransaction: async id =>
      await mutate({
        variables: { id },
        update: (proxy, { data: { refundTransaction } }) => {
          const variables = {
            CollectiveId: ownProps.CollectiveId,
            limit: 20,
            offset: 0,
          };

          // Retrieve the query from the cache
          const data = proxy.readQuery({
            query: getTransactionsQuery,
            variables,
          });

          // Insert new transaction at the beginning
          data.allTransactions.unshift(refundTransaction.refundTransaction);

          // write data back for the query
          proxy.writeQuery({ query: getTransactionsQuery, variables, data });
        },
      }),
  }),
});

export default addMutation(withIntl(RefundTransactionBtn));
