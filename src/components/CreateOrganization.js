import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import { addCreateCollectiveMutation } from '../graphql/mutations';
import CreateCollectiveForm from './CreateCollectiveForm';
import CollectiveCover from './CollectiveCover';
import SignInForm from './SignInForm';
import { FormattedMessage } from 'react-intl';
import { Router } from '../server/pages';
import { get } from 'lodash';

class CreateOrganization extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    createCollective: PropTypes.func,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { collective: { type: 'ORGANIZATION' }, result: {} };
    this.createCollective = this.createCollective.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  async createCollective(CollectiveInputType) {
    if (!CollectiveInputType.tos) {
      this.setState({
        result: { error: 'Please accept the terms of service' },
      });
      return;
    }
    if (get(this.host, 'settings.tos') && !CollectiveInputType.hostTos) {
      this.setState({
        result: { error: 'Please accept the terms of fiscal sponsorship' },
      });
      return;
    }

    this.setState({ status: 'loading' });
    CollectiveInputType.type = 'ORGANIZATION';
    console.log('>>> createOrganization', CollectiveInputType);

    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      const collectiveUrl = `${window.location.protocol}//${window.location.host}/${
        collective.slug
      }?status=collectiveCreated&CollectiveId=${collective.id}`;
      this.setState({
        status: 'idle',
        result: {
          success: `Organization created successfully: ${collectiveUrl}`,
        },
      });
      Router.pushRoute('collective', {
        CollectiveId: collective.id,
        slug: collective.slug,
        status: 'collectiveCreated',
      });
    } catch (err) {
      console.error('>>> createOrganization error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      this.setState({ result: { error: errorMsg } });
      throw new Error(errorMsg);
    }
  }

  render() {
    const { LoggedInUser } = this.props;

    const title = 'Create a new organization';

    return (
      <div className="CreateOrganization">
        <style jsx>
          {`
            .result {
              text-align: center;
              margin-bottom: 5rem;
            }
            .success {
              color: green;
            }
            .error {
              color: red;
            }
            .CollectiveTemplatePicker {
              max-width: 700px;
              margin: 0 auto;
            }
            .CollectiveTemplatePicker .field {
              margin: 0;
            }
            .login {
              margin: 0 auto;
              text-align: center;
            }
            .signin {
              text-align: center;
            }
          `}
        </style>

        <Header title={title} className={this.state.status} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveCover
            title={title}
            description={
              <FormattedMessage
                id="collectives.create.description"
                defaultMessage="An organization allows you to make donations as a company or as a team. You can also set a monthly limit within which the members of the organization can make contributions."
              />
            }
            collective={this.state.collective}
          />

          <div className="content">
            {!LoggedInUser && (
              <div className="signin">
                <h2>
                  <FormattedMessage
                    id="collectives.create.signin"
                    defaultMessage="Sign in or create an Open Collective account"
                  />
                </h2>
                <SignInForm next={'/organizations/new'} />
              </div>
            )}
            {LoggedInUser && (
              <div>
                <CreateCollectiveForm
                  collective={this.state.collective}
                  onSubmit={this.createCollective}
                  onChange={this.resetError}
                />

                <div className="result">
                  <div className="success">{this.state.result.success}</div>
                  <div className="error">{this.state.result.error}</div>
                </div>
              </div>
            )}
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default addCreateCollectiveMutation(CreateOrganization);
