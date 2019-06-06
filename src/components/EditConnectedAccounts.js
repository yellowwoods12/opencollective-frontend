import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import EditConnectedAccount from './EditConnectedAccount';
import { groupBy } from 'lodash';
import { capitalize } from '../lib/utils';

class EditConnectedAccounts extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    connectedAccounts: PropTypes.arrayOf(PropTypes.object),
    editMode: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    const { collective } = props;

    this.state = { services: ['twitter'], editMode: props.editMode || false };

    this.messages = defineMessages({
      'collective.connectedAccounts.stripe.button': {
        id: 'collective.connectedAccounts.stripe.button',
        defaultMessage: 'Connect Stripe',
      },
      'collective.connectedAccounts.stripe.description': {
        id: 'collective.connectedAccounts.stripe.description',
        defaultMessage: 'Connect a Stripe account to start accepting donations',
      },
    });
    this.connectedAccounts = groupBy(props.connectedAccounts, 'service');

    if (collective.type === 'USER') {
      this.state.services.push('github');
    }
    if (collective.type === 'USER' || collective.type === 'ORGANIZATION') {
      this.state.services.push('stripe');
    }
  }

  render() {
    const { collective } = this.props;

    return (
      <div className="EditConnectedAccounts">
        {this.state.services.map(service => (
          <div key={`connect-${service}`}>
            <h2>{capitalize(service)}</h2>
            <EditConnectedAccount
              collective={collective}
              service={service}
              connectedAccount={this.connectedAccounts[service] && this.connectedAccounts[service][0]}
            />
          </div>
        ))}
      </div>
    );
  }
}

export default withIntl(EditConnectedAccounts);
