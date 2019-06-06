import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages, injectIntl } from 'react-intl';

import InputField from './InputField';
import { getCurrencySymbol } from '../lib/utils';
import { cloneDeep } from 'lodash';

class EditGoals extends React.Component {
  static propTypes = {
    goals: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.object,
    currency: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.defaultType = 'yearlyBudget';
    this.state = { goals: cloneDeep(props.goals) };
    this.renderGoal = this.renderGoal.bind(this);
    this.addGoal = this.addGoal.bind(this);
    this.removeGoal = this.removeGoal.bind(this);
    this.editGoal = this.editGoal.bind(this);
    this.onChange = props.onChange.bind(this);

    this.messages = defineMessages({
      'goal.add': { id: 'goal.add', defaultMessage: 'add goal' },
      'goal.remove': { id: 'goal.remove', defaultMessage: 'remove goal' },
      'type.label': { id: 'goal.type.label', defaultMessage: 'type' },
      balance: { id: 'goal.balance.label', defaultMessage: 'balance' },
      yearlyBudget: {
        id: 'goal.yearlyBudget.label',
        defaultMessage: 'yearly budget',
      },
      'title.label': { id: 'goal.title.label', defaultMessage: 'title' },
      'title.placeholder': {
        id: 'goal.title.placeholder',
        defaultMessage: 'Required if you want the goal to be displayed on the collective page',
      },
      'description.label': {
        id: 'goal.description.label',
        defaultMessage: 'description',
      },
      'amount.label': { id: 'goal.amount.label', defaultMessage: 'amount' },
    });

    const getOptions = arr => {
      return arr.map(key => {
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key]);
        return obj;
      });
    };

    this.fields = [
      {
        name: 'type',
        type: 'select',
        options: getOptions(['balance', 'yearlyBudget']),
        label: intl.formatMessage(this.messages['type.label']),
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['amount.label']),
      },
      {
        name: 'title',
        label: intl.formatMessage(this.messages['title.label']),
        maxLength: 64,
        placeholder: intl.formatMessage(this.messages['title.placeholder']),
      },
      {
        name: 'description',
        type: 'textarea',
        label: intl.formatMessage(this.messages['description.label']),
      },
    ];
  }

  editGoal(index, fieldname, value) {
    const goals = this.state.goals;
    if (value === 'onetime') {
      value = null;
    }
    goals[index] = {
      ...goals[index],
      type: goals[index]['type'] || this.defaultType,
      [fieldname]: value,
    };
    this.setState({ goals });
    this.onChange({ goals });
  }

  addGoal() {
    const goals = this.state.goals;
    goals.push({});
    this.setState({ goals });
  }

  removeGoal(index) {
    const goals = this.state.goals;
    if (index < 0 || index > goals.length) return;
    goals.splice(index, 1);
    this.setState({ goals });
    this.onChange({ goals });
  }

  renderGoal(goal, index) {
    const { intl } = this.props;

    const defaultValues = {
      ...goal,
      type: goal.type || this.defaultType,
    };

    // We need to assign a key to the goal otherwise we can't properly remove one, same issue as #996
    goal.key = goal.key || Math.round(Math.random() * 100000);

    return (
      <div className={`goal ${goal.slug}`} key={`goal-${index}-${goal.key}`}>
        <div className="goalActions">
          <a className="removeGoal" href="#" onClick={() => this.removeGoal(index)}>
            {intl.formatMessage(this.messages['goal.remove'])}
          </a>
        </div>
        <Form horizontal>
          {this.fields.map(
            field =>
              (!field.when || field.when(defaultValues)) && (
                <InputField
                  className="horizontal"
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  component={field.component}
                  description={field.description}
                  maxLength={field.maxLength}
                  type={field.type}
                  defaultValue={defaultValues[field.name] || field.defaultValue}
                  options={field.options}
                  pre={field.pre}
                  placeholder={field.placeholder}
                  onChange={value => this.editGoal(index, field.name, value)}
                />
              ),
          )}
        </Form>
      </div>
    );
  }

  render() {
    const { intl } = this.props;

    return (
      <div className="EditGoals">
        <style jsx>
          {`
            :global(.goalActions) {
              text-align: right;
              font-size: 1.3rem;
            }
            :global(.field) {
              margin: 1rem;
            }
            .editGoalsActions {
              text-align: right;
              margin-top: -10px;
            }
            :global(.goal) {
              margin: 3rem 0;
            }
          `}
        </style>

        <div className="goals">
          <h2>{this.props.title}</h2>
          {this.state.goals.map(this.renderGoal)}
        </div>
        <div className="editGoalsActions">
          <Button className="addGoal" bsStyle="primary" onClick={() => this.addGoal()}>
            {intl.formatMessage(this.messages['goal.add'])}
          </Button>
        </div>
      </div>
    );
  }
}

export default injectIntl(EditGoals);
