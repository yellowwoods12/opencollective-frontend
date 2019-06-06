import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage, FormattedDate } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import Avatar from './Avatar';
import Link from './Link';
import SmallButton from './SmallButton';
import { pick } from 'lodash';
import InputField from './InputField';

class Comment extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    comment: PropTypes.object,
    LoggedInUser: PropTypes.object,
    editComment: PropTypes.func,
    intl: PropTypes.object.isRequired,
    editable: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      comment: props.comment,
      mode: undefined,
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      edit: { id: 'comment.edit', defaultMessage: 'edit' },
      cancelEdit: { id: 'comment.cancelEdit', defaultMessage: 'cancel edit' },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
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

  handleChange(attr, value) {
    this.setState({
      modified: true,
      comment: {
        ...this.state.comment,
        [attr]: value,
      },
    });
    window.state = {
      modified: true,
      comment: { ...this.state.comment, [attr]: value },
    };
  }

  async save() {
    const comment = pick(this.state.comment, ['id', 'html']);
    await this.props.editComment(comment);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const { intl, LoggedInUser, editable } = this.props;

    const { comment } = this.state;
    if (!comment) return <div />;

    return (
      <div className={`comment ${this.state.mode}View`}>
        <style jsx>
          {`
            .comment {
              width: 100%;
              margin: 0.5em 0;
              padding: 0.5em;
              transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
              position: relative;
              display: flex;
            }
            a {
              cursor: pointer;
            }
            .fromCollective {
              float: left;
              margin-right: 1rem;
            }
            .body {
              overflow: hidden;
              font-size: 1.5rem;
              width: 100%;
            }
            .description {
              text-overflow: ellipsis;
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

            .actions > div {
              display: flex;
              margin: 0.5rem 0;
            }

            .actions .leftColumn {
              width: 72px;
              margin-right: 1rem;
              float: left;
            }

            .commentActions :global(> div) {
              margin-right: 0.5rem;
            }
          `}
        </style>
        <style jsx global>
          {`
            .comment .actions > div > div {
              margin-right: 0.5rem;
            }
            .comment p {
              margin: 0rem;
            }
          `}
        </style>
        <div className="fromCollective">
          <Link
            route="collective"
            params={{ slug: comment.fromCollective.slug }}
            title={comment.fromCollective.name}
            passHref
          >
            <Avatar
              src={comment.fromCollective.image}
              type={comment.fromCollective.type}
              name={comment.fromCollective.name}
              key={comment.fromCollective.id}
              radius={40}
            />
          </Link>
        </div>
        <div className="body">
          <div className="header">
            <div className="meta">
              <span className="createdAt">
                <FormattedDate value={comment.createdAt} day="numeric" month="numeric" />
              </span>{' '}
              |&nbsp;
              <span className="metaItem">
                <Link route={`/${comment.fromCollective.slug}`}>{comment.fromCollective.name}</Link>
              </span>
              {editable && LoggedInUser && LoggedInUser.canEditComment(comment) && (
                <span>
                  {' '}
                  |{' '}
                  <a className="toggleEditComment" onClick={this.toggleEdit}>
                    {intl.formatMessage(this.messages[`${this.state.mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
                  </a>
                </span>
              )}
            </div>
            <div className="description">
              {this.state.mode !== 'edit' && <div dangerouslySetInnerHTML={{ __html: comment.html }} />}
              {this.state.mode === 'edit' && (
                <InputField
                  name={`comment-${comment.id}`}
                  type="html"
                  defaultValue={comment.html}
                  onChange={value => this.handleChange('html', value)}
                />
              )}
            </div>
          </div>

          {editable && (
            <div className="actions">
              {this.state.mode === 'edit' && (
                <div>
                  <SmallButton className="primary save" onClick={this.save} disabled={!this.state.modified}>
                    <FormattedMessage id="save" defaultMessage="save" />
                  </SmallButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const editCommentQuery = gql`
  mutation editComment($comment: CommentAttributesInputType!) {
    editComment(comment: $comment) {
      id
      html
      createdAt
      collective {
        id
        slug
        currency
        name
        host {
          id
          slug
        }
        stats {
          id
          balance
        }
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

const addMutation = graphql(editCommentQuery, {
  props: ({ mutate }) => ({
    editComment: async comment => {
      return await mutate({ variables: { comment } });
    },
  }),
});

export default withIntl(addMutation(Comment));
