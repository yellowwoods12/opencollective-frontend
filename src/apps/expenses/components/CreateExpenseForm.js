import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { get } from 'lodash';
import Markdown from 'react-markdown';

import withIntl from '../../../lib/withIntl';
import { getCurrencySymbol } from '../../../lib/utils';
import { Link } from '../../../server/pages';

import InputField from '../../../components/InputField';
import SignInForm from '../../../components/SignInForm';
import categories from '../../../constants/categories';
import Button from '../../../components/Button';
import { P } from '../../../components/Text';
import Container from '../../../components/Container';

class CreateExpenseForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    mode: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.messages = defineMessages({
      paypal: {
        id: 'expense.payoutMethod.paypal',
        defaultMessage: 'PayPal ({paypalEmail, select, missing {missing} other {{paypalEmail}}})',
      },
      'newExpense.paypal.label': {
        id: 'newExpense.paypal.label',
        defaultMessage: 'Please provide address',
      },
      other: {
        id: 'expense.payoutMethod.manual',
        defaultMessage: 'Other (see instructions)',
      },
      donation: {
        id: 'expense.payoutMethod.donation',
        defaultMessage: 'Donation',
      },
      'error.descriptionMissing': {
        id: 'expense.error.descriptionMissing',
        defaultMessage: 'Missing description',
      },
      'error.amountMissing': {
        id: 'expense.error.amountMissing',
        defaultMessage: 'Amount must be greater than 0',
      },
      'error.privateMessageMissing': {
        id: 'expense.error.privateMessageMissing',
        defaultMessage: "Please provide instructions on how you'd like to be reimbursed as a private note",
      },
      'error.paypalEmailMissing': {
        id: 'expense.error.paypalEmailMissing',
        defaultMessage: 'Please provide your PayPal email address (or change the payout method)',
      },
      'error.attachmentMissing': {
        id: 'expense.error.attachmentMissing',
        defaultMessage: 'Missing attachment',
      },
    });

    this.categoriesOptions = categories(props.collective.slug).map(category => {
      return { [category]: category };
    });

    this.state = {
      modified: false,
      expense: {
        category: Object.keys(this.categoriesOptions[0])[0],
        payoutMethod: 'paypal',
        paypalEmail: (props.LoggedInUser && props.LoggedInUser.paypalEmail) || null,
      },
      isExpenseValid: false,
      loading: false,
    };
  }

  getOptions(arr, intlVars) {
    return arr.map(key => {
      const obj = {};
      obj[key] = this.props.intl.formatMessage(this.messages[key], intlVars);
      return obj;
    });
  }

  validate(expense) {
    const { intl } = this.props;
    if (!expense.description) {
      this.setState({
        error: intl.formatMessage(this.messages['error.descriptionMissing']),
      });
      return false;
    }
    if (!expense.amount > 0) {
      this.setState({
        error: intl.formatMessage(this.messages['error.amountMissing']),
      });
      return false;
    }
    if (!expense.attachment) {
      this.setState({
        error: intl.formatMessage(this.messages['error.attachmentMissing']),
      });
      return false;
    }
    if (expense.payoutMethod === 'other' && !expense.privateMessage) {
      this.setState({
        error: intl.formatMessage(this.messages['error.privateMessageMissing']),
      });
      return false;
    }
    if (expense.payoutMethod === 'paypal' && !expense.paypalEmail) {
      this.setState({
        error: intl.formatMessage(this.messages['error.paypalEmailMissing']),
      });
      return false;
    }
    this.setState({ error: null });
    return true;
  }

  handleChange(attr, value) {
    const expense = {
      ...this.state.expense,
      [attr]: value,
    };
    const newState = {
      modified: true,
      expense,
      isExpenseValid: this.validate(expense),
    };
    this.setState(newState);
    this.props.onChange && this.props.onChange(expense);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (!this.props.LoggedInUser && newProps.LoggedInUser && !this.state.expense.paypalEmail) {
      this.handleChange('paypalEmail', newProps.LoggedInUser.paypalEmail);
    }
  }

  async onSubmit(e) {
    if (e) {
      e.preventDefault();
    }

    this.setState({
      loading: true,
    });

    try {
      await this.props.onSubmit(this.state.expense);
      this.setState({
        modified: false,
        isExpenseValid: false,
        expense: {},
        loading: false,
      });
    } catch (e) {
      this.setState({ loading: false });
      console.error('CreateExpenseForm onSubmit error', e);
    }
    return false;
  }

  renderForm() {
    const { LoggedInUser, intl, collective } = this.props;
    const { expense } = this.state;

    const payoutMethods = this.getOptions(['paypal', 'other', 'donation'], {
      paypalEmail: get(expense, 'user.paypalEmail') || intl.formatMessage(this.messages['newExpense.paypal.label']),
    });

    return (
      <div className={`CreateExpenseForm ${this.props.mode}`}>
        <style jsx>
          {`
            .CreateExpenseForm {
              font-size: 1.2rem;
              overflow: hidden;
              padding: 0 2rem 5rem;
            }
            .disclaimer,
            .expensePolicy {
              font-size: 1.4rem;
              margin: 2rem 0;
            }
            .description {
              font-size: 1.4rem;
            }
            .CreateExpenseForm .frame {
              padding: 4px;
              margin-top: 1rem;
              margin-right: 1rem;
              float: left;
              width: 128px;
            }
            .CreateExpenseForm img {
              width: 100%;
            }
            .leftColumn,
            .rightColumn {
              overflow: hidden;
            }
            .leftColumn {
              float: left;
              margin-right: 2rem;
              display: flex;
              flex-direction: column;
            }
            .col {
              float: left;
              display: flex;
              flex-direction: column;
              margin-right: 1rem;
              margin-top: 1rem;
            }
            .col.incurredAt {
              width: 12rem;
            }
            .col.emailInput {
              width: 25rem;
            }
            .row {
              clear: both;
              margin-left: 0;
              margin-right: 0;
            }
            .row .col.large {
              width: 100%;
            }
            label {
              text-transform: uppercase;
              color: #aaaeb3;
              font-weight: 300;
              white-space: nowrap;
            }
            .netAmountInCollectiveCurrency {
              font-weight: bold;
            }
            .error {
              display: flex;
              align-items: center;
              color: red;
              margin-left: 1rem;
            }
            @media (max-width: 600px) {
              .leftColumn {
                float: none;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .attachment img {
                width: 90%;
              }
            }
          `}
        </style>
        <style global jsx>
          {`
            .CreateExpenseForm .inputField {
              margin: 0;
            }

            .CreateExpenseForm .descriptionField {
              width: 50rem;
              max-width: 100%;
            }

            .CreateExpenseForm .amountField {
              max-width: 15rem;
            }

            .CreateExpenseForm .inputField textarea {
              font-size: 1.2rem;
            }

            .CreateExpenseForm .attachmentField {
              width: 128px;
            }

            .CreateExpenseForm .attachmentField .form-group {
              margin: 0;
            }

            .CreateExpenseForm .col.privateMessage {
              width: 100%;
            }

            @media (max-width: 600px) {
              .attachmentField {
                width: 90%;
              }
            }
          `}
        </style>

        <Container as="form" onSubmit={this.onSubmit} maxWidth={[500, null, 800]} mx="auto">
          {!collective.expensePolicy && LoggedInUser && LoggedInUser.canEditCollective(collective) && (
            <div className="expensePolicy">
              <h2>
                <FormattedMessage id="collective.expensePolicy.label" defaultMessage="Expense policy" />
              </h2>
              <p>
                <FormattedMessage
                  id="collective.expensePolicy.description"
                  defaultMessage="It can be daunting for the community to file an expense. Help them by providing a clear expense policy to explain what they can expense."
                />
              </p>
              <Button className="blue" href={`/${collective.slug}/edit/expenses`}>
                <FormattedMessage id="expense.expensePolicy.add" defaultMessage="add an expense policy" />
              </Button>
            </div>
          )}
          {(collective.expensePolicy || get(collective, 'host.expensePolicy')) && (
            <div className="expensePolicy">
              <h2>
                <FormattedMessage id="expense.expensePolicy" defaultMessage="Expense policy" />
              </h2>
              {collective.expensePolicy && <Markdown source={collective.expensePolicy} />}
              {get(collective, 'host.expensePolicy') && <Markdown source={get(collective, 'host.expensePolicy')} />}
            </div>
          )}
          <div className="disclaimer">
            <FormattedMessage
              id="expense.disclaimer"
              defaultMessage="You must upload a valid receipt or invoice. We should be able to see clearly on the picture (or PDF) the total amount paid, the date, the items purchased and the legal address."
            />
            &nbsp;
            <Link route="faq" params={{ path: 'faq', pageSlug: 'expenses' }}>
              <a>
                <FormattedMessage id="needHelp" defaultMessage="Need help?" />
              </a>
            </Link>
          </div>

          <div className="leftColumn">
            <div className="frame">
              <InputField
                type="dropzone"
                options={{ accept: 'image/jpeg, image/png, application/pdf' }}
                name="attachment"
                className="attachmentField"
                onChange={attachment => this.handleChange('attachment', attachment)}
                defaultValue={expense.attachment}
                placeholder={'/static/images/receipt.svg'}
                description={
                  <FormattedMessage
                    id="expense.attachment.description"
                    defaultMessage="Upload receipt or invoice (photo or PDF)"
                  />
                }
              />
            </div>
          </div>

          <div className="rightColumn">
            <div className="row">
              <div className="col large">
                <label>
                  <FormattedMessage id="expense.description" defaultMessage="description" />
                </label>
                <div className="description">
                  <span className="description">
                    <InputField
                      type="text"
                      name="description"
                      defaultValue={expense.description}
                      className="descriptionField"
                      maxLength={255}
                      onChange={description => this.handleChange('description', description)}
                    />
                  </span>
                </div>
              </div>
            </div>

            <div className="col">
              <label>
                <FormattedMessage id="expense.amount" defaultMessage="amount" />
              </label>
              <div className="amountDetails">
                <span className="amount">
                  <InputField
                    defaultValue={expense.amount}
                    pre={getCurrencySymbol(collective.currency)}
                    type="currency"
                    name="amount"
                    className="amountField"
                    onChange={amount => this.handleChange('amount', amount)}
                  />
                </span>
              </div>
            </div>

            <div className="col incurredAt">
              <label>
                <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
              </label>
              <div className="incurredAt">
                <span className="incurredAt">
                  <InputField
                    defaultValue={new Date()}
                    type="date"
                    name="incurredAt"
                    className="incurredAtField"
                    onChange={incurredAt => this.handleChange('incurredAt', incurredAt)}
                  />
                </span>
              </div>
            </div>

            <div className="col">
              <label>
                <FormattedMessage id="expense.category" defaultMessage="category" />
              </label>
              <div className="category">
                <span className="category">
                  <InputField
                    type="select"
                    options={this.categoriesOptions}
                    defaultValue={expense.category}
                    name="category"
                    className="categoryField"
                    onChange={category => this.handleChange('category', category)}
                  />
                </span>
              </div>
            </div>

            <div className="col">
              <label>
                <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
              </label>
              <InputField
                type="select"
                name="payoutMethod"
                options={payoutMethods}
                defaultValue={expense.payoutMethod}
                onChange={payoutMethod => this.handleChange('payoutMethod', payoutMethod)}
              />
            </div>

            {this.state.expense.payoutMethod === 'paypal' && (
              <div className="col emailInput">
                <label>
                  <FormattedMessage id="expense.payoutMethod.paypal.label" defaultMessage="PayPal address" />
                </label>
                <InputField
                  type="email"
                  name="paypalEmail"
                  key={`paypalEmail-${get(LoggedInUser, 'id')}`}
                  defaultValue={this.state.expense.paypalEmail}
                  onChange={paypalEmail => this.handleChange('paypalEmail', paypalEmail)}
                />
              </div>
            )}

            <div className="col privateMessage">
              <label>
                <FormattedMessage id="expense.privateMessage" defaultMessage="Private instructions" />
              </label>
              <InputField
                type="textarea"
                name="privateMessage"
                onChange={privateMessage => this.handleChange('privateMessage', privateMessage)}
                defaultValue={expense.privateMessage}
                description={
                  <FormattedMessage
                    id="expense.privateMessage.description"
                    defaultMessage="Private instructions for the host to reimburse your expense"
                  />
                }
              />
            </div>

            <div className="row">
              <div>
                <Button className="blue" type="submit" disabled={this.state.loading || !this.state.isExpenseValid}>
                  {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
                  {!this.state.loading && <FormattedMessage id="expense.new.submit" defaultMessage="Submit Expense" />}
                </Button>
              </div>

              {this.state.error && <div className="error">{this.state.error}</div>}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  render() {
    const { LoggedInUser, collective } = this.props;

    if (!LoggedInUser) {
      return (
        <div className="CreateExpenseForm">
          <P textAlign="center" mt={4} fontSize="LeadParagraph" lineHeight="LeadParagraph">
            <FormattedMessage id="expenses.create.login" defaultMessage="Sign up or login to submit an expense." />
          </P>
          <SignInForm next={`/${collective.slug}/expenses/new`} />
        </div>
      );
    } else {
      return this.renderForm();
    }
  }
}

export default withIntl(CreateExpenseForm);
