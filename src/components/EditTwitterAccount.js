import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo';
import { FormattedMessage, defineMessages } from 'react-intl';
import gql from 'graphql-tag';
import InputField from './InputField';
import SmallButton from './SmallButton';
import { cloneDeep, pick } from 'lodash';
import { Form, Row, Col } from 'react-bootstrap';

class EditTwitterAccount extends React.Component {
  static propTypes = {
    connectedAccount: PropTypes.object.isRequired,
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
    editConnectedAccount: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.renderNotification = this.renderNotification.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.messages = defineMessages({
      'newBacker.toggle.label': {
        id: 'connectedAccounts.twitter.newBacker.toggle.label',
        defaultMessage: 'New backers',
      },
      'newBacker.toggle.description': {
        id: 'connectedAccounts.twitter.newBacker.toggle.description',
        defaultMessage:
          'Whenever you have a new backer that has provided a twitter username, a tweet will be sent from your connected account',
      },
      'newBacker.tweet': {
        id: 'connectedAccounts.twitter.newBacker.tweet',
        defaultMessage:
          '{backerTwitterHandle} thank you for your {amount} donation 🙏 - your contribution makes a difference!',
      },
      'monthlyStats.toggle.label': {
        id: 'connectedAccounts.twitter.monthlyStats.toggle.label',
        defaultMessage: 'Monthly stats',
      },
      'monthlyStats.toggle.description': {
        id: 'connectedAccounts.twitter.monthlyStats.toggle.description',
        defaultMessage:
          'Every first of the month, automatically send a public tweet with the latest stats, the new backers and the all time top backers',
      },
      'updatePublished.toggle.label': {
        id: 'connectedAccounts.twitter.updatePublished.toggle.label',
        defaultMessage: 'Update published',
      },
      'updatePublished.toggle.description': {
        id: 'connectedAccounts.twitter.updatePublished.toggle.description',
        defaultMessage: 'Send a tweet whenever you publish an update',
      },
      'tenBackers.toggle.label': {
        id: 'connectedAccounts.twitter.tenBackers.toggle.label',
        defaultMessage: '10 backers',
      },
      'tenBackers.toggle.description': {
        id: 'connectedAccounts.twitter.tenBackers.toggle.description',
        defaultMessage: 'Whenever one of the collectives that you are hosting reaches 10 backers',
      },
      'tenBackers.tweet': {
        id: 'connectedAccounts.twitter.tenBackers.tweet',
        defaultMessage:
          '🎉 {collective} just reached 10 backers! Thank you {topBackersTwitterHandles} 🙌  Support them too!',
      },
      'oneHundredBackers.toggle.label': {
        id: 'connectedAccounts.twitter.oneHundredBackers.toggle.label',
        defaultMessage: '100 backers',
      },
      'oneHundredBackers.toggle.description': {
        id: 'connectedAccounts.twitter.oneHundredBackers.toggle.description',
        defaultMessage: 'Whenever one of the collectives that you are hosting reaches 100 backers',
      },
      'oneHundredBackers.tweet': {
        id: 'connectedAccounts.twitter.oneHundredBackers.tweet',
        defaultMessage: '🎉 {collective} just reached 100 backers!! 🙌  Support them too!',
      },
      'oneThousandBackers.toggle.label': {
        id: 'connectedAccounts.twitter.oneThousandBackers.toggle.label',
        defaultMessage: '1,000 backers',
      },
      'oneThousandBackers.toggle.description': {
        id: 'connectedAccounts.twitter.oneThousandBackers.toggle.description',
        defaultMessage: 'Whenever one of the collectives that you are hosting reaches 1,000 backers',
      },
      'oneThousandBackers.tweet': {
        id: 'connectedAccounts.twitter.oneThousandBackers.tweet',
        defaultMessage: '🎉 {collective} just reached 1,000 backers!! 🙌  Support them too!',
      },
    });

    this.notificationTypes = [];
    if (props.collective.type === 'COLLECTIVE') {
      this.notificationTypes = ['newBacker', 'monthlyStats', 'updatePublished'];
    }

    if (props.collective.isHost) {
      this.notificationTypes = ['tenBackers', 'oneHundredBackers', 'oneThousandBackers'];
    }

    this.state = { connectedAccount: cloneDeep(props.connectedAccount) };
    this.state.connectedAccount.settings = this.state.connectedAccount.settings || {};
    this.notificationTypes.forEach(notificationType => {
      this.state.connectedAccount.settings[notificationType] = this.state.connectedAccount.settings[
        notificationType
      ] || { active: false };
      if (this.messages[`${notificationType}.tweet`]) {
        this.state.connectedAccount.settings[notificationType].tweet =
          this.state.connectedAccount.settings[notificationType].tweet ||
          props.intl.formatMessage(this.messages[`${notificationType}.tweet`]);
      }
    });
  }

  async onClick() {
    const connectedAccount = pick(this.state.connectedAccount, ['id', 'settings']);
    await this.props.editConnectedAccount(connectedAccount);
    this.setState({ isModified: false });
  }

  handleChange(notification, attr, val) {
    const { connectedAccount } = this.state;
    connectedAccount.settings[notification][attr] = val;
    this.setState({ connectedAccount, isModified: true });
  }

  renderNotification(notificationType) {
    const { intl } = this.props;
    const { connectedAccount } = this.state;

    return (
      <div className="notificationSettings" key={notificationType}>
        <style jsx>
          {`
            .notificationSettings :global(label) {
              margin-top: 0.7rem;
            }
            .notificationSettings :global(.form-group) {
              margin-bottom: 0rem;
            }
            .notificationSettings :global(.inputField textarea) {
              height: 14rem;
            }
          `}
        </style>
        <Row>
          <Col sm={12}>
            <InputField
              type="switch"
              name={`${notificationType}.active`}
              className="horizontal"
              defaultValue={connectedAccount.settings[notificationType].active}
              label={intl.formatMessage(this.messages[`${notificationType}.toggle.label`])}
              description={
                this.messages[`${notificationType}.toggle.description`] &&
                intl.formatMessage(this.messages[`${notificationType}.toggle.description`])
              }
              onChange={activateNewBacker => this.handleChange(notificationType, 'active', activateNewBacker)}
            />
            {this.messages[`${notificationType}.tweet`] && (
              <InputField
                type="textarea"
                className="horizontal"
                maxLength={280}
                charCount={true}
                name={`${notificationType}.tweet`}
                defaultValue={
                  connectedAccount.settings[notificationType].tweet ||
                  intl.formatMessage(this.messages[`${notificationType}.tweet`])
                }
                onChange={tweet => this.handleChange(notificationType, 'tweet', tweet)}
              />
            )}
          </Col>
        </Row>
      </div>
    );
  }

  render() {
    return (
      <div className="EditTwitterAccount">
        <Form horizontal>
          <details>
            <summary>
              <FormattedMessage id="connectedAccounts.twitter.settings" defaultMessage="Settings" />
            </summary>
            {this.notificationTypes.map(this.renderNotification)}
          </details>
          <Row>
            <Col sm={3} />
            <Col sm={9}>
              {this.state.isModified && (
                <SmallButton className="default" bsStyle="primary" onClick={this.onClick}>
                  <FormattedMessage id="save" defaultMessage="save" />
                </SmallButton>
              )}
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

const editConnectedAccountQuery = gql`
  mutation editConnectedAccount($connectedAccount: ConnectedAccountInputType!) {
    editConnectedAccount(connectedAccount: $connectedAccount) {
      id
      settings
    }
  }
`;

const addMutation = graphql(editConnectedAccountQuery, {
  props: ({ mutate }) => ({
    editConnectedAccount: async connectedAccount => {
      return await mutate({ variables: { connectedAccount } });
    },
  }),
});

export default addMutation(withIntl(EditTwitterAccount));
