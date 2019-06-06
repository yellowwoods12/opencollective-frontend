import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';

import withIntl from '../../../lib/withIntl';
import { isValidEmail } from '../../../lib/utils';

import SmallButton from '../../../components/SmallButton';

class PayExpenseBtn extends React.Component {
  static propTypes = {
    expense: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    host: PropTypes.object,
    disabled: PropTypes.bool,
    paymentProcessorFeeInCollectiveCurrency: PropTypes.number,
    hostFeeInCollectiveCurrency: PropTypes.number,
    platformFeeInCollectiveCurrency: PropTypes.number,
    lock: PropTypes.func,
    unlock: PropTypes.func,
    payExpense: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      paymentProcessorFeeInCollectiveCurrency: 0,
    };
    this.onClick = this.onClick.bind(this);
    this.messages = defineMessages({
      'paypal.missing': {
        id: 'expense.payoutMethod.paypal.missing',
        defaultMessage: 'Please provide a valid paypal email address',
      },
    });
  }

  async onClick() {
    const { expense, lock, unlock } = this.props;
    if (this.props.disabled) {
      return;
    }
    lock();
    this.setState({ loading: true });
    try {
      await this.props.payExpense(
        expense.id,
        this.props.paymentProcessorFeeInCollectiveCurrency,
        this.props.hostFeeInCollectiveCurrency,
        this.props.platformFeeInCollectiveCurrency,
      );
      this.setState({ loading: false });
      unlock();
    } catch (e) {
      console.log('>>> payExpense error: ', e);
      const error = e.message && e.message.replace(/GraphQL error:/, '');
      this.setState({ error, loading: false });
      unlock();
    }
  }

  render() {
    const { collective, expense, intl, host } = this.props;
    let disabled = this.state.loading,
      selectedPayoutMethod = expense.payoutMethod,
      title = '',
      error = this.state.error;

    if (expense.payoutMethod === 'paypal') {
      if (!isValidEmail(get(expense, 'user.paypalEmail')) && !isValidEmail(get(expense, 'user.email'))) {
        disabled = true;
        title = intl.formatMessage(this.messages['paypal.missing']);
      } else {
        const paypalPaymentMethod =
          get(host, 'paymentMethods') && host.paymentMethods.find(pm => pm.service === 'paypal');
        if (get(expense, 'user.paypalEmail') === get(paypalPaymentMethod, 'name')) {
          selectedPayoutMethod = 'other';
        }
      }
    }
    if (get(collective, 'stats.balance') < expense.amount) {
      disabled = true;
      error = <FormattedMessage id="expense.pay.error.insufficientBalance" defaultMessage="Insufficient balance" />;
    }
    return (
      <div className="PayExpenseBtn">
        <style jsx>
          {`
            .PayExpenseBtn {
              align-items: flex-end;
              display: flex;
              flex-wrap: wrap;
            }
            .error {
              display: flex;
              align-items: center;
              color: red;
              font-size: 1.3rem;
              padding-left: 1rem;
            }

            .processorFee {
              margin-right: 1rem;
              max-width: 16rem;
            }

            .processorFee label {
              margin: 0;
            }
          `}
        </style>
        <style global jsx>
          {`
            .processorFee .inputField,
            .processorFee .form-group {
              margin: 0;
            }

            .processorFee .inputField {
              margin-top: 0.5rem;
            }
          `}
        </style>
        <SmallButton className="pay" onClick={this.onClick} disabled={this.props.disabled || disabled} title={title}>
          {selectedPayoutMethod === 'other' && (
            <FormattedMessage id="expense.pay.manual.btn" defaultMessage="record as paid" />
          )}
          {selectedPayoutMethod !== 'other' && (
            <FormattedMessage
              id="expense.pay.btn"
              defaultMessage="pay with {paymentMethod}"
              values={{ paymentMethod: expense.payoutMethod }}
            />
          )}
        </SmallButton>
        <div className="error">{error}</div>
      </div>
    );
  }
}

const payExpenseQuery = gql`
  mutation payExpense(
    $id: Int!
    $paymentProcessorFeeInCollectiveCurrency: Int
    $hostFeeInCollectiveCurrency: Int
    $platformFeeInCollectiveCurrency: Int
  ) {
    payExpense(
      id: $id
      paymentProcessorFeeInCollectiveCurrency: $paymentProcessorFeeInCollectiveCurrency
      hostFeeInCollectiveCurrency: $hostFeeInCollectiveCurrency
      platformFeeInCollectiveCurrency: $platformFeeInCollectiveCurrency
    ) {
      id
      status
      collective {
        id
        stats {
          id
          balance
        }
        host {
          id
          paymentMethods {
            id
            balance
          }
        }
      }
    }
  }
`;

const addMutation = graphql(payExpenseQuery, {
  props: ({ mutate }) => ({
    payExpense: async (
      id,
      paymentProcessorFeeInCollectiveCurrency,
      hostFeeInCollectiveCurrency,
      platformFeeInCollectiveCurrency,
    ) => {
      return await mutate({
        variables: {
          id,
          paymentProcessorFeeInCollectiveCurrency,
          hostFeeInCollectiveCurrency,
          platformFeeInCollectiveCurrency,
        },
      });
    },
  }),
});

export default addMutation(withIntl(PayExpenseBtn));
