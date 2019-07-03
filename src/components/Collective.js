import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get } from 'lodash';

import withIntl from '../lib/withIntl';

import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import CollectiveCover from './CollectiveCover';
import NotificationBar from './NotificationBar';
import MembersWithData from './MembersWithData';
import Link from './Link';
import TierCard from './TierCard';
import CollectivesWithData from './CollectivesWithData';
import SectionTitle from './SectionTitle';
import TeamSection from './TeamSection';
import UpdatesSection from './UpdatesSection';
import ExpensesSection from '../apps/expenses/components/ExpensesSection';
import EventsSection from './EventsSection';
import LongDescription from './LongDescription';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Collective extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    query: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({
      'collective.created': {
        id: 'collective.created',
        defaultMessage: 'Your collective has been created with success.',
      },
      'collective.created.description': {
        id: 'collective.created.description',
        defaultMessage:
          'While you are waiting for approval from your host ({host}), you can already customize your collective, file expenses and even create events.',
      },
      'collective.isArchived': {
        id: 'collective.isArchived',
        defaultMessage: '{name} has been archived.',
      },
      'collective.isArchived.description': {
        id: 'collective.isArchived.description',
        defaultMessage: 'This collective has been archived and can no longer be used for any activities.',
      },
      'collective.isApproved': {
        id: 'collective.isApproved',
        defaultMessage: '{name} has been approved.',
      },
      'collective.isApproved.description': {
        id: 'collective.isApproved.description',
        defaultMessage: 'The collective has been approved by the host ({host}) on {date}',
        values: {
          date: <FormattedDate value={collective.approvedAt} month="long" year="numeric" />,
        },
      },
      'collective.donate': {
        id: 'collective.donate',
        defaultMessage: 'donate',
      },
      'collective.since': {
        id: 'usercollective.since',
        defaultMessage: 'since {year}',
      },
      'collective.members.admin.title': {
        id: 'collective.members.admin.title',
        defaultMessage: '{n} {n, plural, one {core contributor} other {core contributors}}',
      },
      'collective.members.member.title': {
        id: 'collective.members.member.title',
        defaultMessage: '{n} {n, plural, one {member} other {members}}',
      },
      'collective.members.backer.title': {
        id: 'collective.members.backer.title',
        defaultMessage: '{n} {n, plural, one {backer} other {backers}}',
      },
      'collective.members.fundraiser.title': {
        id: 'collective.members.fundraiser.title',
        defaultMessage: '{n} {n, plural, one {fundraiser} other {fundraisers}}',
      },
      'collective.members.follower.title': {
        id: 'collective.members.follower.title',
        defaultMessage: '{n} {n, plural, one {follower} other {followers}}',
      },
      'collective.menu.host': {
        id: 'collective.menu.host',
        defaultMessage: 'contributing to {n} {n, plural, one {collective} other {collectives}}',
      },
      'collective.menu.admin': {
        id: 'collective.menu.admin',
        defaultMessage: 'contributing to {n} {n, plural, one {collective} other {collectives}}',
      },
      'collective.menu.member': {
        id: 'collective.menu.member',
        defaultMessage: 'member of {n} {n, plural, one {collective} other {collectives}}',
      },
      'collective.menu.backer': {
        id: 'collective.menu.backer',
        defaultMessage: 'backing {n} {n, plural, one {collective} other {collectives}}',
      },
      'collective.menu.fundraiser': {
        id: 'collective.menu.fundraiser',
        defaultMessage: 'raised money for {n} {n, plural, one {collective} other {collectives}}',
      },
      'collective.menu.follower': {
        id: 'collective.menu.follower',
        defaultMessage: 'following {n} {n, plural, one {collective} other {collectives}}',
      },
      'collective.section.contributors.empty': {
        id: 'collective.section.contributors.empty',
        defaultMessage: "You don't have any financial contributors yet.",
      },
      'collective.section.contributors.noHost': {
        id: 'collective.section.contributors.noHost',
        defaultMessage: 'Enable people to contribute financially to your collective by adding a host',
      },
      'collective.addHostBtn': {
        id: 'collective.addHostBtn',
        defaultMessage: 'Add a host',
      },
    });
  }

  componentDidMount() {
    window.oc = { collective: this.props.collective }; // for easy debugging
  }

  render() {
    const { intl, LoggedInUser, query, collective } = this.props;
    const status = get(query, 'status');

    const donateParams = { collectiveSlug: collective.slug, verb: 'donate' };
    if (query.referral) {
      donateParams.referral = query.referral;
    }
    const backgroundImage =
      collective.backgroundImage || get(collective, 'parentCollective.backgroundImage') || defaultBackgroundImage;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const notification = {};
    if (status === 'collectiveCreated' && !collective.isApproved) {
      notification.title = intl.formatMessage(this.messages['collective.created']);
      notification.description = intl.formatMessage(this.messages['collective.created.description'], {
        host: collective.host.name,
      });
    } else if (status === 'collectiveArchived' || collective.isArchived) {
      notification.title = intl.formatMessage(this.messages['collective.isArchived'], {
        name: collective.name,
      });
      notification.description = intl.formatMessage(this.messages['collective.isArchived.description']);
      notification.status = 'collectiveArchived';
    } else if (status === 'collectiveApproved' || (collective.isApproved && !collective.isArchived)) {
      notification.title = intl.formatMessage(this.messages['collective.isApproved'], {
        name: collective.name,
      });
      notification.description = intl.formatMessage(this.messages['collective.isApproved.description']);
      notification.status = 'collectiveApproved';
    }
    const cta =
      collective.isActive && collective.host ? { href: `/${collective.slug}/contribute`, label: 'contribute' } : null;
    const contributorsStats = { ...get(collective, 'stats.backers') };
    contributorsStats.organizations += contributorsStats.collectives || 0;

    return (
      <div className={classNames(`CollectivePage ${collective.type}`)}>
        <style jsx>
          {`
            .sidebar {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .longDescription {
              margin-top: 3rem;
            }
            .tier {
              text-align: center;
              font-size: 1.4rem;
            }
            section {
              max-width: 1080px;
              margin: 0 auto 5rem;
            }
            #events .eventsList {
              padding-left: 3rem;
            }
            .cardsList {
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              justify-content: center;
            }
            .balance {
              text-align: center;
            }
            .balance label {
              margin: 0 0.5rem;
              font-weight: 500;
            }
            .actions {
              text-align: center;
            }
            .actions :global(button.btn) {
              margin-right: 5px;
            }
            .tiers :global(.TierCard) {
              margin: 1rem;
            }
            @media (min-width: 600px) {
              .leftContent {
                width: 60%;
                float: left;
              }
              .sidebar {
                float: right;
                margin: 3rem 0 3rem 3rem;
              }
            }
            .archiveCollective {
              -webkit-filter: grayscale(100%);
              -moz-filter: grayscale(100%);
              -ms-filter: grayscale(100%);
              filter: grayscale(100%);
            }
          `}
        </style>

        <Header
          title={collective.name}
          description={collective.description || collective.longDescription}
          twitterHandle={collective.twitterHandle || get(collective.parentCollective, 'twitterHandle')}
          image={collective.image || get(collective.parentCollective, 'image') || backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          href={`/${collective.slug}`}
        />

        <Body>
          <div className={classNames('CollectivePage', { archiveCollective: collective.isArchived })}>
            <NotificationBar
              status={notification.status || status}
              title={notification.title}
              description={notification.description}
              error={this.state.error}
            />

            <CollectiveCover collective={collective} cta={cta} LoggedInUser={LoggedInUser} key={collective.slug} />

            <div>
              <div>
                <div className="content">
                  <div className="leftContent">
                    {(get(collective, 'stats.updates') > 0 || canEditCollective) && (
                      <UpdatesSection LoggedInUser={LoggedInUser} collective={collective} />
                    )}

                    {(get(collective, 'stats.events') > 0 || canEditCollective) && (
                      <EventsSection LoggedInUser={LoggedInUser} collective={collective} />
                    )}
                    <LongDescription
                      longDescription={collective.longDescription}
                      defaultSubtitle={collective.description}
                    />

                    <TeamSection collective={collective} LoggedInUser={LoggedInUser} limit={10} />
                  </div>
                  {collective.isActive && collective.host && (
                    <div className="sidebar tiers" id="contribute">
                      {collective.tiers.map(tier => (
                        <TierCard
                          key={`TierCard-${tier.slug}`}
                          collective={collective}
                          tier={tier}
                          referral={query.referral}
                        />
                      ))}
                      <div className="CustomDonationTierCard">
                        <Link route="orderCollective" params={{ collectiveSlug: collective.slug, verb: 'donate' }}>
                          <a>
                            <FormattedMessage
                              id="collective.tiers.donate"
                              defaultMessage="Or make a custom financial contribution"
                            />
                          </a>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {get(collective, 'stats.collectives.memberOf') > 0 && (
                <section id="members" className="clear">
                  <div className="content">
                    <SectionTitle
                      title={
                        <FormattedMessage
                          id="collective.collective.memberOf.collective.parent.title"
                          defaultMessage={'Member collectives'}
                        />
                      }
                      subtitle={
                        <FormattedMessage
                          id="collective.collective.memberOf.collective.parent.subtitle"
                          values={{ n: collective.stats.collectives.memberOf }}
                          defaultMessage={
                            '{n, plural, one {this collective is} other {{n} collectives are}} part of our collective'
                          }
                        />
                      }
                    />

                    <div className="cardsList">
                      <CollectivesWithData
                        ParentCollectiveId={collective.id}
                        orderBy="balance"
                        type="COLLECTIVE"
                        orderDirection="DESC"
                        limit={20}
                      />
                    </div>
                  </div>
                </section>
              )}

              <ExpensesSection collective={collective} LoggedInUser={LoggedInUser} limit={10} />

              <section id="contributors" className="tier">
                <div className="content">
                  {!collective.host && (
                    <SectionTitle
                      section="contributors"
                      subtitle={intl.formatMessage(
                        this.messages[`collective.section.contributors.${collective.host ? 'empty' : 'noHost'}`],
                      )}
                      action={{
                        label: intl.formatMessage(this.messages['collective.addHostBtn']),
                        href: `/${collective.slug}/edit/host`,
                      }}
                    />
                  )}
                  {collective.host && get(collective, 'stats.backers.all') === 0 && (
                    <SectionTitle
                      section="contributors"
                      subtitle={intl.formatMessage(this.messages['collective.section.contributors.empty'])}
                    />
                  )}
                  {get(collective, 'stats.backers.all') > 0 && (
                    <div>
                      <SectionTitle section="contributors" values={contributorsStats} />

                      <MembersWithData
                        collective={collective}
                        type="ORGANIZATION,COLLECTIVE"
                        LoggedInUser={LoggedInUser}
                        role="BACKER"
                        orderBy="totalDonations"
                        limit={20}
                      />

                      <MembersWithData
                        collective={collective}
                        LoggedInUser={LoggedInUser}
                        type="USER"
                        role="BACKER"
                        limit={100}
                        orderBy="totalDonations"
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withIntl(Collective);
