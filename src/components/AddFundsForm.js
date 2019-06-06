import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { withApollo } from 'react-apollo';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import { getCurrencySymbol, formatCurrency } from '../lib/utils';
import withIntl from '../lib/withIntl';
import InputField from './InputField';
import { AddFundsSourcePickerWithData, AddFundsSourcePickerForUserWithData } from './AddFundsSourcePicker';

class AddFundsForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    host: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    client: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    /* If the component doesn't receive a host property it means that
       the form will load the hosts from the list of collectives the
       user is an admin of. See issue #1080 */
    this.isAddFundsToOrg = !this.props.host;

    this.state = {
      form: {
        totalAmount: 0,
        hostFeePercent: get(props, 'collective.hostFeePercent'),
      },
      result: {},
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.messages = defineMessages({
      'api.error.unreachable': {
        id: 'api.error.unreachable',
        defaultMessage: "Can't reach the API. Please try again in a few.",
      },
      'totalAmount.label': {
        id: 'addfunds.amount.label',
        defaultMessage: 'amount',
      },
      'description.label': {
        id: 'addfunds.description.label',
        defaultMessage: 'description',
      },
      'FromCollectiveId.label': {
        id: 'addfunds.FromCollectiveId.label',
        defaultMessage: 'source',
      },
      'FromCollectiveId.addfundstoorg.label': {
        id: 'addfundstoorg.FromCollectiveId.label',
        defaultMessage: 'host',
      },
      'hostFeePercent.label': {
        id: 'addfunds.hostFeePercent.label',
        defaultMessage: 'Host fee',
      },
      'platformFeePercent.label': {
        id: 'addfunds.platformFeePercent.label',
        defaultMessage: 'Platform fee',
      },
      'name.label': { id: 'user.name.label', defaultMessage: 'name' },
      'email.label': { id: 'user.email.label', defaultMessage: 'email' },
      'organization.label': {
        id: 'addfunds.organization.label',
        defaultMessage: 'organization',
      },
      'website.label': { id: 'user.website.label', defaultMessage: 'website' },
    });

    this.totalAmountField = {
      name: 'totalAmount',
      type: 'currency',
      focus: true,
      pre: getCurrencySymbol(props.collective.currency),
    };

    this.fields = [
      this.totalAmountField,
      {
        name: 'description',
      },
      {
        name: 'FromCollectiveId',
        type: 'component',
        when: () => !this.isAddFundsToOrg,
        component: AddFundsSourcePickerWithData,
        options: {
          collective: this.props.collective,
          host: this.props.host,
          paymentMethod: get(this, 'props.host.paymentMethods')
            ? this.props.host.paymentMethods.find(pm => pm.service === 'opencollective')
            : null,
        },
      },
      {
        name: 'FromCollectiveId',
        type: 'component',
        when: () => this.isAddFundsToOrg,
        component: AddFundsSourcePickerForUserWithData,
        labelName: 'FromCollectiveId.addfundstoorg.label',
        options: {
          LoggedInUser: this.props.LoggedInUser,
        },
      },
      {
        name: 'name',
        when: form => form.FromCollectiveId === 'other',
      },
      {
        name: 'email',
        when: form => form.FromCollectiveId === 'other',
      },
      {
        name: 'organization',
        when: form => form.FromCollectiveId === 'other',
      },
      {
        name: 'website',
        when: form => form.FromCollectiveId === 'other',
      },
      {
        name: 'hostFeePercent',
        when: () => !this.isAddFundsToOrg,
        type: 'number',
        post: '%',
      },
      {
        name: 'platformFeePercent',
        type: 'number',
        post: '%',
        when: () => this.props.LoggedInUser && this.props.LoggedInUser.isRoot() && !this.isAddFundsToOrg,
      },
    ];

    this.fields = this.fields.map(field => {
      const label = this.messages[field.labelName || `${field.name}.label`];
      if (label) {
        field.label = intl.formatMessage(label);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    });
  }

  retrieveHostFeePercent = async CollectiveId => {
    const getHostCollectiveQuery = gql`
      query Collective($CollectiveId: Int) {
        Collective(id: $CollectiveId) {
          id
          hostFeePercent
        }
      }
    `;
    try {
      const result = await this.props.client.query({
        query: getHostCollectiveQuery,
        variables: { CollectiveId },
      });
      const { hostFeePercent } = result.data.Collective;
      return hostFeePercent;
    } catch (error) {
      console.error(error);
    }
  };

  handleChange = async (obj, attr, value) => {
    const { host } = this.props;

    const newState = { ...this.state };
    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (attr === 'FromCollectiveId') {
      if (host && value !== host.id) {
        newState[obj].hostFeePercent = this.props.collective.hostFeePercent;
      } else {
        /* We don't have the host object if we're adding funds to
           orgs. The attr props.collective contains the organization
           receiving funds and the right host must be pulled from
           GraphQL when the user chooses an option in the combo. */
        newState[obj].hostFeePercent = await this.retrieveHostFeePercent(value);
        newState[obj].platformFeePercent = 5;
      }
    }

    this.setState(newState);
    if (typeof window !== 'undefined') {
      window.state = newState;
    }
  };

  handleSubmit(e) {
    e && e.preventDefault();
    this.props.onSubmit(this.state.form);
    return false;
  }

  render() {
    const { loading } = this.props;

    const hostFeePercent = this.state.form.hostFeePercent || 0;
    const platformFeePercent = this.state.form.platformFeePercent || 0;

    const hostFeeAmount = formatCurrency(
      (hostFeePercent / 100) * this.state.form.totalAmount,
      this.props.collective.currency,
      { precision: 2 },
    );
    const platformFeeAmount = formatCurrency(
      (platformFeePercent / 100) * this.state.form.totalAmount,
      this.props.collective.currency,
      { precision: 2 },
    );
    const netAmount = formatCurrency(
      this.state.form.totalAmount * (1 - (hostFeePercent + platformFeePercent) / 100),
      this.props.collective.currency,
      { precision: 2 },
    );

    /* We don't need to show these details if there are no amounts
       present yet */
    const showAddFundsToOrgDetails =
      this.isAddFundsToOrg && this.state.form.totalAmount > 0 && (hostFeePercent > 0 || platformFeePercent > 0);

    // recompute this value based on new props
    this.totalAmountField.pre = getCurrencySymbol(this.props.collective.currency);

    return (
      <div className="AddFundsForm">
        <style jsx>
          {`
            h2 {
              margin: 3rem 0 3rem 0;
              font-size: 2rem;
            }
            .AddFundsForm {
              max-width: 700px;
              margin: 0 auto;
            }
            .userDetailsForm {
              overflow: hidden;
            }
            .paymentDetails {
              overflow: hidden;
            }
            .AddFundsForm :global(.tier) {
              margin: 0 0 1rem 0;
            }
            label {
              max-width: 100%;
              padding-right: 1rem;
            }
            .result {
              margin-top: 3rem;
            }
            .result div {
              width: 100%;
            }
            .error {
              color: red;
              font-weight: bold;
            }
            .value {
              padding-top: 7px;
              display: inline-block;
            }
            .details {
              margin: 0.5rem 0 1rem 0;
              width: 100%;
            }
            hr {
              margin: 0.5rem 0;
              color: black;
            }
            td.amount {
              text-align: right;
            }
            .disclaimer {
              font-size: 1.2rem;
            }
            .note {
              padding: 8px 0;
            }
          `}
        </style>
        <style jsx global>
          {`
            .AddFundsForm .actions .btn {
              margin-right: 0.5rem;
            }
          `}
        </style>
        <div>
          <Form horizontal onSubmit={this.handleSubmit}>
            <div className="userDetailsForm">
              <h2>
                <FormattedMessage
                  id="addfunds.title"
                  defaultMessage="Add Funds to {collective}"
                  values={{ collective: this.props.collective.name }}
                />
              </h2>
              {this.fields.map(
                field =>
                  (!field.when || field.when(this.state.form)) && (
                    <Row key={`${field.name}.input`}>
                      <Col sm={12}>
                        <InputField
                          {...field}
                          className={`horizontal ${field.className}`}
                          defaultValue={this.state.form[field.name]}
                          onChange={value => this.handleChange('form', field.name, value)}
                        />
                      </Col>
                    </Row>
                  ),
              )}
              <Row>
                <Col sm={12}>
                  <div className="form-group">
                    <label className="col-sm-2 control-label inputField">
                      <FormattedMessage id="addfunds.details" defaultMessage="Details" />
                    </label>
                    <Col sm={10}>
                      <table className="details">
                        <tbody>
                          <tr>
                            <td>
                              <FormattedMessage id="addfunds.totalAmount" defaultMessage="Funding amount" />
                            </td>
                            <td className="amount">
                              {formatCurrency(this.state.form.totalAmount, this.props.collective.currency, {
                                precision: 2,
                              })}
                            </td>
                          </tr>
                          {!this.isAddFundsToOrg && (
                            <tr>
                              <td>
                                <FormattedMessage
                                  id="addfunds.hostFees"
                                  defaultMessage="Host fees ({hostFees})"
                                  values={{ hostFees: `${hostFeePercent}%` }}
                                />
                              </td>
                              <td className="amount">{hostFeeAmount}</td>
                            </tr>
                          )}
                          {platformFeePercent > 0 && !this.isAddFundsToOrg && (
                            <tr>
                              <td>
                                <FormattedMessage
                                  id="addfunds.platformFees"
                                  defaultMessage="Platform fees ({platformFees})"
                                  values={{
                                    platformFees: `${platformFeePercent}%`,
                                  }}
                                />
                              </td>
                              <td className="amount">{platformFeeAmount}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={2}>
                              <hr size={1} />
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <FormattedMessage id="addfunds.netAmount" defaultMessage="Net amount" />
                            </td>
                            <td className="amount">{netAmount}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div>
                        {showAddFundsToOrgDetails && (
                          <div className="note">
                            Please put aside {hostFeePercent}% ({hostFeeAmount}) for your host fees and 5% (
                            {platformFeeAmount}) for platform fees.
                          </div>
                        )}
                      </div>

                      <div className="disclaimer">
                        {this.props.host && (
                          <FormattedMessage
                            id="addfunds.disclaimer"
                            defaultMessage="By clicking below, you agree to set aside {amount} in your bank account on behalf of the collective"
                            values={{
                              amount: formatCurrency(this.state.form.totalAmount, this.props.collective.currency),
                            }}
                          />
                        )}

                        {!this.props.host && (
                          <FormattedMessage
                            id="addfunds.disclaimerOrganization"
                            defaultMessage="By clicking below, you agree to create a pre-paid credit card with the amount of {amount} for this organization"
                            values={{
                              amount: formatCurrency(this.state.form.totalAmount, this.props.collective.currency),
                            }}
                          />
                        )}
                      </div>
                    </Col>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col xsHidden md={2} />
                <Col xs={12} md={10} className="actions">
                  <Button bsStyle="primary" onClick={() => this.handleSubmit()} disabled={loading}>
                    {loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
                    {!loading && <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" />}
                  </Button>
                  <Button bsStyle="default" onClick={() => this.props.onCancel()}>
                    <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                  </Button>
                </Col>
              </Row>
            </div>
            <div className="result">
              {this.state.result.success && <div className="success">{this.state.result.success}</div>}
              {this.state.result.error && <div className="error">{this.state.result.error}</div>}
            </div>
          </Form>
        </div>
      </div>
    );
  }
}

export default withIntl(withApollo(AddFundsForm));
