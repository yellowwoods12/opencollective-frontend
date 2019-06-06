import React from 'react';
import PropTypes from 'prop-types';
import Error from './Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import Membership from './Membership';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

const MEMBERSHIPS_PER_PAGE = 10;

class MembershipsWithData extends React.Component {
  static propTypes = {
    memberCollectiveSlug: PropTypes.string,
    orderBy: PropTypes.string,
    limit: PropTypes.number,
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object,
    fetchMore: PropTypes.func,
    refetch: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.fetchMore = this.fetchMore.bind(this);
    this.refetch = this.refetch.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      role: null,
      loading: false,
    };
  }

  onChange() {
    const { onChange } = this.props;
    onChange && this.node && onChange({ height: this.node.offsetHeight });
  }

  componentDidMount() {
    this.onChange();
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
      this.onChange();
    });
  }

  refetch(role) {
    this.setState({ role });
    this.props.refetch({ role });
  }

  render() {
    const { data, LoggedInUser } = this.props;

    if (data.error) {
      console.error('graphql error>>>', data.error.message);
      return <Error message="GraphQL error" />;
    }
    if (!data.allMembers) {
      return <div />;
    }
    const memberships = [...data.allMembers];
    if (memberships.length === 0) {
      return <div />;
    }

    const limit = this.props.limit || MEMBERSHIPS_PER_PAGE * 2;
    return (
      <div className="MembersContainer" ref={node => (this.node = node)}>
        <style jsx>
          {`
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .Collectives {
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              justify-content: center;
              overflow: hidden;
              margin: 1rem 0;
            }
          `}
        </style>

        <div className="Collectives cardsList">
          {memberships.map(membership => (
            <Membership key={membership.id} membership={membership} LoggedInUser={LoggedInUser} />
          ))}
        </div>
        {memberships.length % 10 === 0 && memberships.length >= limit && (
          <div className="loadMoreBtn">
            <Button bsStyle="default" onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
              {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
            </Button>
          </div>
        )}
      </div>
    );
  }
}

const getMembershipsQuery = gql`
  query Members($memberCollectiveSlug: String, $role: String, $limit: Int, $offset: Int, $orderBy: String) {
    allMembers(
      memberCollectiveSlug: $memberCollectiveSlug
      role: $role
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      id
      role
      createdAt
      stats {
        totalDonations
      }
      tier {
        id
        name
      }
      collective {
        id
        type
        name
        currency
        description
        slug
        image
        backgroundImage
        stats {
          id
          backers {
            all
          }
          yearlyBudget
        }
        parentCollective {
          slug
        }
      }
    }
  }
`;

export const addMembershipsData = graphql(getMembershipsQuery, {
  options(props) {
    return {
      variables: {
        memberCollectiveSlug: props.memberCollectiveSlug,
        offset: 0,
        role: props.role,
        orderBy: props.orderBy || 'totalDonations',
        limit: props.limit || MEMBERSHIPS_PER_PAGE * 2,
      },
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allMembers.length,
          limit: MEMBERSHIPS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allMembers: [...previousResult.allMembers, ...fetchMoreResult.allMembers],
          });
        },
      });
    },
  }),
});

export default addMembershipsData(withIntl(MembershipsWithData));
