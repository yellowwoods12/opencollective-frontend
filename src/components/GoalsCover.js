import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get, maxBy, debounce, sortBy } from 'lodash';
import styled, { css } from 'styled-components';
import slugify from 'slugify';

import withIntl from '../lib/withIntl';
import { formatCurrency } from '../lib/utils';
import { fadeIn } from './StyledKeyframes';

const GoalContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  text-align: right;
  transition: width 3s;
  height: 20px;
  border-right: 1px solid ${props => (props.goal.isReached ? '#64c800' : '#3399ff')};
  width: ${props => `${props.goal.progress * 100}%`};
  z-index: ${props => (['balance', 'yearlyBudget'].includes(props.goal.slug) ? 310 : (20 - props.index) * 10)};
  transition: ${props =>
    `opacity 0.3s, height 1s, padding-top 1s${props.goal.animateProgress ? ', width 2s ease-in-out;' : ''};`}

  .caption {
    padding: 1rem 0.5rem 1rem 0.5rem;
    color: #aaaeb3;
    font-size: 13px;
    line-height: 15px;
  }

  .label {
    background: #252729;
    color: #aaaeb3;
    padding: 0;
    line-height: 1.5;
    font-size: 13px;
    text-align: right;
  }

  .amount {
    color: white;
    font-weight: bold;
  }

  .interval {
    color: #aaaeb3;
    font-size: 10px;
    font-weight: normal;
  }

  ${props =>
    props.goal.isReached &&
    props.goal.position === 'below' &&
    css`
      border-top: 4px solid #64c800;
    `}

  ${props =>
    props.goal.position === 'above' &&
    css`
      border-bottom: 4px solid #3399ff;
      top: auto;
      bottom: 76px;

      .caption {
        margin-top: -4.5rem;
      }
    `}

  ${props => {
    if (props.goal.level === 1) {
      if (props.goal.position === 'below') {
        return css`
          height: 60px;
          padding-top: 4rem;
        `;
      } else {
        return css`
          height: 60px;
        `;
      }
    }
  }}

  ${props => {
    if (props.goal.isOverlapping) {
      return css`
        opacity: 0.2;
      `;
    } else {
      return css`
        animation: ${fadeIn} 0.3s;
      `;
    }
  }}

  ${props =>
    props.goal.hidden &&
    css`
      opacity: 0;
    `}
`;

class GoalsCover extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    interpolation: PropTypes.oneOf(['linear', 'logarithm', 'auto']),
    intl: PropTypes.object.isRequired,
  };

  static defaultProps = {
    interpolation: 'auto',
  };

  constructor(props) {
    super(props);
    this.renderGoal = this.renderGoal.bind(this);
    this.updateGoals = debounce(this.updateGoals.bind(this), 100, { maxWait: 200 });
    this.labelsRefs = {};
    this.messages = defineMessages({
      admin: { id: 'menu.admin', defaultMessage: 'admin' },
      backer: { id: 'menu.backer', defaultMessage: 'backer' },
      attendee: { id: 'menu.attendee', defaultMessage: 'attendee' },
      fundraiser: { id: 'menu.fundraiser', defaultMessage: 'fundraiser' },
      parenting: { id: 'menu.parenting', defaultMessage: 'member collectives' },
      about: { id: 'menu.about', defaultMessage: 'about' },
      events: { id: 'menu.events', defaultMessage: 'events' },
      updates: { id: 'menu.updates', defaultMessage: 'updates' },
      budget: { id: 'menu.budget', defaultMessage: 'budget' },
      contributors: { id: 'menu.contributors', defaultMessage: 'contributors' },
      'menu.edit.collective': {
        id: 'menu.edit.collective',
        defaultMessage: 'edit collective',
      },
      'menu.edit.user': {
        id: 'menu.edit.user',
        defaultMessage: 'edit profile',
      },
      'menu.edit.organization': {
        id: 'menu.edit.organization',
        defaultMessage: 'edit organization',
      },
      'menu.edit.event': {
        id: 'menu.edit.event',
        defaultMessage: 'edit event',
      },
      'bar.balance': {
        id: 'cover.bar.balance',
        defaultMessage: "Today's Balance",
      },
      'bar.yearlyBudget': {
        id: 'cover.bar.yearlyBudget',
        defaultMessage: 'Estimated Annual Budget',
      },
    });

    const maxGoal = maxBy(get(props.collective, 'settings.goals', []), g => (g.title ? g.amount : 0));
    this.currentProgress = maxGoal ? this.getMaxCurrentAchievement() / maxGoal.amount : 1.0;
    this.interpolation = props.interpolation || get(props.collective, 'settings.goalsInterpolation', 'auto');
    this.state = { ...this.populateGoals(true, true) };
  }

  componentDidMount() {
    this.setState({ ...this.populateGoals(false, true), firstMount: true });
    window.addEventListener('resize', this.updateGoals);
  }

  componentDidUpdate(oldProps) {
    if (this.state.firstMount || this.props.collective !== oldProps.collective) {
      this.updateGoals();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateGoals);
  }

  updateGoals(firstMount = false) {
    this.setState({ ...this.populateGoals(), firstMount });
  }

  /** Returns a percentage (0.0-1.0) that reprensent X position */
  getTranslatedPercentage(x) {
    if (this.interpolation === 'logarithm' || (this.interpolation === 'auto' && this.currentProgress <= 0.3)) {
      // See https://www.desmos.com/calculator/30pua5xx7q
      return -1 * Math.pow(x - 1, 2) + 1;
    }

    return x;
  }

  /** Create goal object with correct defaults and store a ref for React */
  createGoal(slug, params) {
    this.labelsRefs[slug] = this.labelsRefs[slug] || React.createRef();
    return {
      precision: 0,
      isReached: false,
      level: 0,
      position: 'above',
      ...params,
      slug,
    };
  }

  /** Returns the main goals current progress, either max balance or annual budget */
  getMaxCurrentAchievement() {
    const { collective } = this.props;
    return Math.max(get(collective, 'stats.balance'), get(collective, 'stats.yearlyBudget', 0));
  }

  /**
   * Returns the base goals (balance, yearly budget...) without custom goals.
   * All goals returned here have a slug prefilled.
   */
  getInitialGoals() {
    const { intl, collective } = this.props;

    // Always show current balance
    const goals = [
      this.createGoal('balance', {
        animateProgress: true,
        title: intl.formatMessage(this.messages['bar.balance']),
        amount: get(collective, 'stats.balance'),
        precision: 2,
        position: 'below',
        isReached: true,
      }),
    ];

    // Add yearly budget
    if (
      get(collective, 'stats.yearlyBudget') > 0 &&
      get(collective, 'stats.yearlyBudget') !== get(collective, 'stats.balance')
    ) {
      goals.push(
        this.createGoal('yearlyBudget', {
          animateProgress: true,
          title: intl.formatMessage(this.messages['bar.yearlyBudget']),
          amount: get(collective, 'stats.yearlyBudget'),
          precision: 0,
          position: 'below',
          isReached: true,
        }),
      );
    }

    // Animate only the most advanced one
    if (goals.length === 2) {
      if (goals[0].amount <= goals[1].amount) goals[0].animateProgress = false;
      else goals[1].animateProgress = false;
    }

    return goals;
  }

  /**
   * Get at most `maxCustomGoalsToShow` custom goals. If goals are filtered,
   * we make sure to always return the last one to have a complete progress bar.
   *
   * Also adds a unique slug to goals.
   */
  getCustomGoals(maxCustomGoalsToShow) {
    const settingsGoals = get(this.props.collective, 'settings.goals', []);
    const goalsWithTitle = settingsGoals.reduce((goals, goal) => (goal.title ? [...goals, goal] : goals), []);
    const sortedGoals = sortBy(goalsWithTitle, 'amount');
    const goals = sortedGoals.map((goal, idx) => this.createGoal(`goal-${idx}-${slugify(goal.title)}`, goal));

    // No need to remove goals
    if (goals.length <= maxCustomGoalsToShow) {
      return goals;
    }
    // Filter goals, ensure we keep the last one
    const lastGoal = goals[goals.length - 1];
    if (!maxCustomGoalsToShow) {
      return [lastGoal];
    }

    return [...goals.slice(0, maxCustomGoalsToShow - 1), lastGoal];
  }

  /**
   * If a ref exists for this goal, get its real with. Otherwise estimate
   * it based on its title (for initial rendering and server-side rendering)
   */
  getGoalLabelWidthInPx(goal) {
    const ref = this.labelsRefs[goal.slug];
    if (ref && ref.current) {
      return ref.current.offsetWidth + 15; // Add a bigger hit box
    }
    return goal.title.length * 8;
  }

  /** Given a percent size, returns its value in pixels */
  percentageToPx(availWidth, percentage) {
    const progressBarPercentageWidth = availWidth > 420 ? 0.8 : 0.95;
    const progressBarWidthInPx = availWidth * progressBarPercentageWidth;
    return percentage * progressBarWidthInPx;
  }

  /** Given a pixels size, returns its value as a percentage of availWidth */
  pxToPercentage(availWidth, widthInPx) {
    return widthInPx / availWidth;
  }

  /** Returns the overlap size if any, 0 otherwise */
  goalsOverlapInPx(availWidth, maxAmount, prevGoal, goal) {
    if (!prevGoal) {
      return 0;
    }

    // No overlap is possible if not at the same position or level
    if (goal.position !== prevGoal.position || goal.level !== prevGoal.level) {
      return 0;
    }

    // Get position and distance between the markers
    const prevX = this.percentageToPx(availWidth, this.getTranslatedPercentage(prevGoal.amount / maxAmount));
    const curX = this.percentageToPx(availWidth, this.getTranslatedPercentage(goal.amount / maxAmount));
    const prevWidth = this.getGoalLabelWidthInPx(prevGoal);
    // If goal is at the far left of the graphic, label will be moved to the right
    const xLabelOffset = prevX - prevWidth;
    const distance = xLabelOffset < 0 ? curX - prevX + xLabelOffset : curX - prevX;

    // Calculate overlap size
    const curWidth = this.getGoalLabelWidthInPx(goal);
    const offset = distance - curWidth;
    return offset < 0 ? -offset : 0;
  }

  /**
   * Test goals position against the first previous goal on the same position / level
   *
   * @returns {goal, overlap}
   */
  overlapWithPrev(availWidth, maxAmount, prevGoals, goal) {
    for (let i = prevGoals.length - 1; i >= 0; i--) {
      const prevGoal = prevGoals[i];
      if (goal.position === prevGoal.position && goal.level === prevGoal.level) {
        return {
          prevGoal,
          overlap: this.goalsOverlapInPx(availWidth, maxAmount, prevGoal, goal),
        };
      }
    }
    return { prevGoal: null, overlap: 0 };
  }

  /** @returns {Object} {goals, hasCustomGoals, maxAmount, maxLevelAbove} */
  populateGoals(isServerSide, isInitialRender) {
    // Show only one custom goal on mobile
    let maxLevelAbove = 0;
    let availWidth = 700;
    let maxCustomGoalsToShow = 10;
    if (isServerSide) {
      maxCustomGoalsToShow = 0;
    } else {
      availWidth = get(window, 'screen.availWidth') || 560;
      if (availWidth <= 560) maxCustomGoalsToShow = 0;
      else if (availWidth < 728) maxCustomGoalsToShow = 1;
      else if (availWidth < 896) maxCustomGoalsToShow = 2;
      else if (availWidth < 1120) maxCustomGoalsToShow = 3;
    }

    // Get all goals sorted by amount
    const initialGoals = this.getInitialGoals();
    const customGoals = this.getCustomGoals(maxCustomGoalsToShow);
    const goals = sortBy([...initialGoals, ...customGoals], 'amount');
    const maxAmount = maxBy(goals, g => g.amount).amount;
    const maxAchievedYet = this.getMaxCurrentAchievement();

    // Set goals positions
    for (let i = 0; i < goals.length; i++) {
      const isLastGoal = i === goals.length - 1;
      const goal = goals[i];
      goal.progress = this.getTranslatedPercentage(goal.amount / maxAmount);
      goal.isReached = goal.isReached || maxAchievedYet > goal.amount;
      goal.hidden = false;

      const prevGoals = goals.slice(0, i);
      const overlapWithPrev = goal => this.overlapWithPrev(availWidth, maxAmount, prevGoals, goal);
      const { prevGoal, overlap } = overlapWithPrev(goal);

      // -- Overlap 😱 --
      if (overlap > 0) {
        // 1st strategy: we change the level by 1
        const newLevel = Number(!prevGoal.level);
        if (overlapWithPrev({ ...goal, level: newLevel }).overlap === 0) {
          goal.level = newLevel;
          if (goal.position === 'above') {
            maxLevelAbove = Math.max(maxLevelAbove, newLevel);
          }
        } else {
          // 2nd strategy: we shift by given offset, and we change opacity
          // - of the prev goal if this is last goal, of the current otherwise
          // Will not shift at less than 0% or more than 100%
          if (!isLastGoal) {
            goal.isOverlapping = true;
            const newProgress = goal.progress + this.pxToPercentage(availWidth, overlap);
            goal.progress = newProgress <= 1 ? newProgress : 1;
          } else {
            prevGoal.isOverlapping = true;
            const newProgress = prevGoal.progress - this.pxToPercentage(availWidth, overlap);
            prevGoal.progress = newProgress >= 0 ? newProgress : 0;
          }
        }
      }

      // Change progress to animate goal. Never animate the last goal as it would
      // result in a patial progress bar for first rendering. Hide when rendered
      // on server side to avoid getting the marker stuck while waiting for
      // re-hydrating
      if (goal.animateProgress && !isLastGoal) {
        if (isServerSide) goal.hidden = true;
        if (isInitialRender) goal.progress = 0;
      }
    }

    return { goals, maxAmount, maxLevelAbove, hasCustomGoals: customGoals.length > 0 };
  }

  renderGoal(goal, index) {
    const { collective } = this.props;
    const slug = goal.slug;
    const amount = formatCurrency(goal.amount, collective.currency, { precision: goal.precision || 0 });

    return (
      <GoalContainer className={`goal ${goal.slug}`} key={slug} goal={goal} index={index}>
        <div className="caption">
          <div className="label" ref={this.labelsRefs[goal.slug]}>
            {goal.title}
          </div>
          <div className="amount">
            {amount}
            {goal.type === 'yearlyBudget' && (
              <div className="interval">
                <FormattedMessage
                  id="tier.interval"
                  defaultMessage="per {interval, select, month {month} year {year} other {}}"
                  values={{ interval: 'year' }}
                />
              </div>
            )}
          </div>
        </div>
      </GoalContainer>
    );
  }

  render() {
    const { collective } = this.props;

    if (!collective) {
      return <div />;
    }

    return (
      <div className="GoalsCover">
        <style jsx>
          {`
            .GoalsCover {
              overflow: hidden;
            }

            .budgetText {
              text-align: center;
              color: #c2c7cc;
              font-size: 14px;
              line-height: 26px;
              margin: 3rem 0;
            }

            .barContainer {
              position: relative;
              width: 80%;
              margin: 6rem auto 1rem;
              min-height: 80px;
            }

            .barContainer.withGoals {
              margin-top: 10rem;
            }

            .barContainer.max-level-above-1 {
              margin-top: 15rem;
            }

            .annualBudget {
              font-weight: bold;
              color: white;
              margin-left: 5px;
              margin-right: 5px;
            }
            @media (max-width: 420px) {
              .barContainer {
                width: 95%;
              }
            }
          `}
        </style>
        <div>
          {get(collective, 'stats.backers.all') > 0 && (
            <div className="budgetText">
              <FormattedMessage
                id="cover.budget.text"
                defaultMessage="Thanks to your financial contributions, we are operating on an estimated annual budget of {yearlyBudget}"
                values={{
                  yearlyBudget: (
                    <span className="annualBudget">
                      {formatCurrency(get(collective, 'stats.yearlyBudget'), collective.currency, { precision: 0 })}
                    </span>
                  ),
                }}
              />
            </div>
          )}
          <div
            className={`barContainer max-level-above-${this.state.maxLevelAbove} ${
              this.state.hasCustomGoals ? 'withGoals' : ''
            }`}
          >
            <div className="bars">
              {this.state.goals &&
                this.state.goals.map((goal, index) => {
                  return this.renderGoal(goal, index);
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntl(GoalsCover);
