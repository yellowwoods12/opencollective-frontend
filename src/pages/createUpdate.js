import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex, Box } from '@rebass/grid';
import { ArrowBack } from 'styled-icons/boxicons-regular';

import { Router } from '../server/pages';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import EditUpdateForm from '../components/EditUpdateForm';
import Button from '../components/Button';
import Container from '../components/Container';
import Link from '../components/Link';

import { addCollectiveCoverData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { H1 } from '../components/Text';

const BackButtonWrapper = styled(Container)`
  position: relative;
  color: #71757a;
  margin-right: 62px;
  margin-left: 20px;
`;

class CreateUpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    action: PropTypes.string, // not used atm, not clear where it's coming from, not in the route
    createUpdate: PropTypes.func, // from addMutation/createUpdateQuery
    data: PropTypes.object.isRequired, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = { update: {} };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  createUpdate = async update => {
    const {
      data: { Collective },
    } = this.props;
    try {
      update.collective = { id: Collective.id };
      console.log('>>> createUpdate', update);
      const res = await this.props.createUpdate(update);
      console.log('>>> createUpdate res', res);
      this.setState({ isModified: false });
      return Router.pushRoute(`/${Collective.slug}/updates/${res.data.createUpdate.slug}`);
    } catch (e) {
      console.error(e);
    }
  };

  handleChange = (attr, value) => {
    const update = this.state.update;
    update[attr] = value;
    this.setState({ update, isModified: true });
  };

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const canCreateUpdate = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <div className="CreateUpdatePage">
        <style jsx global>
          {`
            .CreateUpdatePage .Updates .update {
              border-top: 1px solid #cacbcc;
            }
          `}
        </style>
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            context="createUpdate"
            collective={collective}
            LoggedInUser={LoggedInUser}
            key={collective.slug}
          />
          <Flex className="content" mt={4} alignItems="baseline">
            <BackButtonWrapper>
              <Link>
                <Container display="flex" color="#71757A" fontSize="14px" alignItems="center">
                  <ArrowBack size={18} />
                  <Box as="span" mx={2}>
                    Back
                  </Box>
                </Container>
              </Link>
            </BackButtonWrapper>
            <Container width={1}>
              {!canCreateUpdate && (
                <div className="login">
                  <p>
                    <FormattedMessage
                      id="updates.create.login"
                      defaultMessage="You need to be logged in as a core contributor of this collective to be able to create an update."
                    />
                  </p>
                  <p>
                    <Button className="blue" href={`/signin?next=/${collective.slug}/updates/new`}>
                      <FormattedMessage id="login.button" defaultMessage="Sign In" />
                    </Button>
                  </p>
                </div>
              )}
              {canCreateUpdate && (
                <Container my={3}>
                  <H1 textAlign="left" fontSize="34px">
                    <FormattedMessage id="updates.new.title" defaultMessage="New update" />
                  </H1>
                </Container>
              )}
              {canCreateUpdate && <EditUpdateForm collective={collective} onSubmit={this.createUpdate} />}
            </Container>
          </Flex>
        </Body>
        <Footer />
      </div>
    );
  }
}

const createUpdateQuery = gql`
  mutation createUpdate($update: UpdateInputType!) {
    createUpdate(update: $update) {
      id
      slug
      title
      summary
      html
      createdAt
      publishedAt
      updatedAt
      tags
      image
      isPrivate
      collective {
        id
        slug
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

const addMutation = graphql(createUpdateQuery, {
  props: ({ mutate }) => ({
    createUpdate: async update => {
      return await mutate({ variables: { update } });
    },
  }),
});

const addGraphQL = compose(
  addCollectiveCoverData,
  addMutation,
);

export default withData(withIntl(withLoggedInUser(addGraphQL(CreateUpdatePage))));
