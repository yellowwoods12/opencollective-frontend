import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import withIntl from '../../../lib/withIntl';
import Avatar from '../../../components/Avatar';
import { capitalize, formatCurrency } from '../../../lib/utils';
import Link from '../../../components/Link';
import SmallButton from '../../../components/SmallButton';
import Moment from '../../../components/Moment';

import AmountCurrency from './AmountCurrency';
import ExpenseDetails from './ExpenseDetails';
import ApproveExpenseBtn from './ApproveExpenseBtn';
import RejectExpenseBtn from './RejectExpenseBtn';
import PayExpenseBtn from './PayExpenseBtn';
import EditPayExpenseFeesForm from './EditPayExpenseFeesForm';
import colors from '../../../constants/colors';

class Expense extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    host: PropTypes.object,
    expense: PropTypes.object,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "summary" for list view, "details" for details view
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    allowPayAction: PropTypes.bool,
    lockPayAction: PropTypes.func,
    unlockPayAction: PropTypes.func,
    editExpense: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      expense: {},
      mode: undefined,
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      pending: { id: 'expense.pending', defaultMessage: 'pending' },
      paid: { id: 'expense.paid', defaultMessage: 'paid' },
      approved: { id: 'expense.approved', defaultMessage: 'approved' },
      rejected: { id: 'expense.rejected', defaultMessage: 'rejected' },
      closeDetails: {
        id: 'expense.closeDetails',
        defaultMessage: 'Close Details',
      },
      edit: { id: 'expense.edit', defaultMessage: 'edit' },
      cancelEdit: { id: 'expense.cancelEdit', defaultMessage: 'cancel edit' },
      viewDetails: {
        id: 'expense.viewDetails',
        defaultMessage: 'View Details',
      },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  }

  toggleDetails() {
    this.setState({
      mode: this.state.mode === 'details' ? 'summary' : 'details',
    });
  }

  cancelEdit() {
    this.setState({ modified: false, mode: 'details' });
  }

  edit() {
    this.setState({ modified: false, mode: 'edit' });
  }

  toggleEdit() {
    this.state.mode === 'edit' ? this.cancelEdit() : this.edit();
  }

  handleChange(obj) {
    const newState = { ...this.state, modified: true, ...obj };
    this.setState(newState);
  }

  async save() {
    const expense = {
      id: this.props.expense.id,
      ...this.state.expense,
    };
    await this.props.editExpense(expense);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const { intl, collective, host, expense, includeHostedCollectives, LoggedInUser, editable } = this.props;

    if (!expense.fromCollective) {
      console.error('No FromCollective for expense', expense);
      return <div />;
    }

    const title = expense.description;
    const status = expense.status.toLowerCase();

    const view = this.props.view || 'summary';
    let { mode } = this.state;
    if (editable && LoggedInUser && !mode) {
      switch (expense.status) {
        case 'PENDING':
          mode = LoggedInUser.canApproveExpense(expense) && 'details';
          break;
        case 'APPROVED':
          mode = LoggedInUser.canPayExpense(expense) && 'details';
          break;
      }
    }
    mode = mode || view;

    const canPay = LoggedInUser && LoggedInUser.canPayExpense(expense) && expense.status === 'APPROVED';

    const canReject =
      LoggedInUser &&
      LoggedInUser.canApproveExpense(expense) &&
      (expense.status === 'PENDING' ||
        (expense.status === 'APPROVED' &&
          (Date.now() - new Date(expense.updatedAt).getTime() < 60 * 1000 * 15 || // admin of collective can reject the expense for up to 10mn after approving it
            LoggedInUser.canEditCollective(collective.host))));

    const canApprove =
      LoggedInUser &&
      LoggedInUser.canApproveExpense(expense) &&
      (expense.status === 'PENDING' ||
        (expense.status === 'REJECTED' && Date.now() - new Date(expense.updatedAt).getTime() < 60 * 1000 * 15)); // we can approve an expense for up to 10mn after rejecting it

    return (
      <div className={`expense ${status} ${this.state.mode}View`}>
        <style jsx>
          {`
            .expense {
              width: 100%;
              margin: 0.5em 0;
              padding: 0.5em;
              transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
              position: relative;
              display: flex;
            }
            .ExpenseId {
              color: ${colors.gray};
              margin-left: 0.5rem;
            }
            .expense.detailsView {
              background-color: #fafafa;
            }
            a {
              cursor: pointer;
            }
            .fromCollective {
              float: left;
              margin-right: 1.6rem;
            }
            .body {
              overflow: hidden;
              font-size: 1.4rem;
              width: 100%;
            }
            .description {
              text-overflow: ellipsis;
              white-space: nowrap;
              overflow: hidden;
              display: block;
            }
            .meta {
              color: #919599;
              font-size: 1.2rem;
            }
            .meta .metaItem {
              margin: 0 0.2rem;
            }
            .meta .collective {
              margin-right: 0.2rem;
            }
            .amount .balance {
              font-size: 1.2rem;
              color: #919599;
            }
            .amount {
              margin-left: 0.5rem;
              text-align: right;
              font-size: 1.5rem;
              font-weight: 300;
            }
            .rejected .status {
              color: #e21a60;
            }
            .approved .status {
              color: #72ce00;
            }

            .status {
              text-transform: uppercase;
            }

            .actions > div {
              align-items: flex-end;
              display: flex;
              flex-wrap: wrap;
              margin: 0.5rem 0;
            }

            .actions .leftColumn {
              width: 72px;
              margin-right: 1rem;
              float: left;
            }
            .expenseActions {
              display: flex;
            }
            .expenseActions :global(> div) {
              margin-right: 0.5rem;
            }

            @media (max-width: 600px) {
              .expense {
                max-height: 50rem;
                padding: 2rem 0.5rem;
              }
              .expense.detailsView {
                max-height: 45rem;
              }
              .details {
                max-height: 30rem;
              }
            }
          `}
        </style>
        <style jsx global>
          {`
            .expense .actions > div > div {
              margin-right: 0.5rem;
            }

            @media screen and (max-width: 700px) {
              .expense .PayExpenseBtn ~ .RejectExpenseBtn {
                flex-grow: 1;
              }
              .expense .SmallButton {
                flex-grow: 1;
                margin-top: 1rem;
              }
              .expense .SmallButton button {
                width: 100%;
              }
            }
          `}
        </style>

        <div className="fromCollective">
          <Link
            route="collective"
            params={{ slug: expense.fromCollective.slug }}
            title={expense.fromCollective.name}
            passHref
          >
            <Avatar
              src={expense.fromCollective.image}
              type={expense.fromCollective.type}
              name={expense.fromCollective.name}
              key={expense.fromCollective.id}
              radius={40}
              className="noFrame"
            />
          </Link>
        </div>
        <div className="body">
          <div className="header">
            <div className="amount pullRight">
              <AmountCurrency amount={-expense.amount} currency={expense.currency} />
            </div>
            <div className="description">
              <Link route={`/${collective.slug}/expenses/${expense.id}`} title={capitalize(title)}>
                {capitalize(title)}
                {view !== 'compact' && <span className="ExpenseId">#{expense.id}</span>}
              </Link>
            </div>
            <div className="meta">
              <Moment relative={true} value={expense.incurredAt} />
              {' | '}
              {includeHostedCollectives && expense.collective && (
                <span className="collective">
                  <Link route={`/${expense.collective.slug}`}>{expense.collective.slug}</Link> (balance:{' '}
                  {formatCurrency(expense.collective.stats.balance, expense.collective.currency)}){' | '}
                </span>
              )}
              <span className="status">{intl.formatMessage(this.messages[status])}</span>
              {' | '}
              <span className="metaItem">
                <Link
                  route="expenses"
                  params={{
                    collectiveSlug: expense.collective.slug,
                    filter: 'categories',
                    value: expense.category,
                  }}
                  scroll={false}
                >
                  {capitalize(expense.category)}
                </Link>
              </span>
              {editable && LoggedInUser && LoggedInUser.canEditExpense(expense) && (
                <span>
                  {' | '}
                  <a className="toggleEditExpense" onClick={this.toggleEdit}>
                    {intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
                  </a>
                </span>
              )}
              {mode !== 'edit' && view === 'summary' && (
                <span>
                  {' | '}
                  <a className="toggleDetails" onClick={this.toggleDetails}>
                    {intl.formatMessage(this.messages[`${mode === 'details' ? 'closeDetails' : 'viewDetails'}`])}
                  </a>
                </span>
              )}
            </div>
          </div>

          <ExpenseDetails
            LoggedInUser={LoggedInUser}
            expense={expense}
            collective={collective}
            onChange={expense => this.handleChange({ expense })}
            mode={mode}
          />

          {editable && (
            <div className="actions">
              {mode === 'edit' && this.state.modified && (
                <div>
                  <div className="leftColumn" />
                  <div className="rightColumn">
                    <SmallButton className="primary save" onClick={this.save}>
                      <FormattedMessage id="expense.save" defaultMessage="save" />
                    </SmallButton>
                  </div>
                </div>
              )}
              {mode !== 'edit' && (canPay || canApprove || canReject) && (
                <div className="manageExpense">
                  {canPay && expense.payoutMethod === 'other' && (
                    <EditPayExpenseFeesForm
                      canEditPlatformFee={LoggedInUser.isRoot()}
                      currency={collective.currency}
                      onChange={fees => this.handleChange({ fees })}
                    />
                  )}
                  <div className="expenseActions">
                    {canPay && (
                      <PayExpenseBtn
                        expense={expense}
                        collective={collective}
                        host={host}
                        {...this.state.fees}
                        disabled={!this.props.allowPayAction}
                        lock={this.props.lockPayAction}
                        unlock={this.props.unlockPayAction}
                      />
                    )}
                    {canApprove && <ApproveExpenseBtn id={expense.id} />}
                    {canReject && <RejectExpenseBtn id={expense.id} />}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const editExpenseQuery = gql`
  mutation editExpense($expense: ExpenseInputType!) {
    editExpense(expense: $expense) {
      id
      description
      amount
      attachment
      category
      privateMessage
      payoutMethod
      status
    }
  }
`;

const addMutation = graphql(editExpenseQuery, {
  props: ({ mutate }) => ({
    editExpense: async expense => {
      return await mutate({ variables: { expense } });
    },
  }),
});

export default withIntl(addMutation(Expense));
