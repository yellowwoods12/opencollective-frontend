import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { withApollo } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import { Button, Popover, OverlayTrigger } from 'react-bootstrap';

import { getTransactionsQuery } from '../../../graphql/queries';
import { exportFile } from '../../../lib/export_file';
import withIntl from '../../../lib/withIntl';
import InputField from '../../../components/InputField';

import { FileDownload } from 'styled-icons/material/FileDownload';

/* Convert the output of the allTransactions query into a CSV payload
   that can be downloaded directly by the user */
export const transformResultInCSV = json => {
  const q = value => `"${value}"`; /* Quote value */
  const f = value => (value / 100).toFixed(2); /* Add cents */
  const d = value => moment(new Date(value)).format('YYYY-MM-DD HH:mm:ss');

  // Sanity check. It will return an empty CSV for the user
  if (json.length === 0) return '';

  // All the json lines contain the same values for these two
  // variables. It's save to get them from any index.
  const hostCurrency = json[0].host.currency;
  const collectiveCurrency = json[0].currency;

  const header = [
    'Transaction Description',
    'User Name',
    'User Profile',
    'Transaction Date',
    'Collective Currency',
    'Host Currency',
    'Transaction Amount',
    `Host Fee (${hostCurrency})`,
    `Open Collective Fee (${hostCurrency})`,
    `Payment Processor Fee (${hostCurrency})`,
    `Net Amount (${collectiveCurrency})`,
    'Subscription Interval',
    'Order Date',
  ].join(',');

  const lines = json.map(i => {
    const profile = `http://opencollective.com/${i.fromCollective.slug}`;
    const subscriptionInterval = i.subscription ? i.subscription.interval : 'one time';
    return [
      q(i.description) /* Transaction Description */,
      q(i.fromCollective.name) /* User Name  */,
      q(profile) /* User Profile  */,
      d(i.createdAt) /* Transaction Date  */,
      q(i.currency) /* Currency */,
      q(hostCurrency) /* Host Currency */,
      f(i.amount) /* Transaction Amount */,
      f(i.hostFeeInHostCurrency) /* Host Fee */,
      f(i.platformFeeInHostCurrency) /* Platform Fee */,
      f(i.paymentProcessorFeeInHostCurrency) /* Payment Processor Fee */,
      f(i.netAmountInCollectiveCurrency) /* Net Amount */,
      q(subscriptionInterval) /* Interval of subscription */,
      q(new Date(i.createdAt).toISOString()) /* Order Date */,
    ].join(',');
  });

  return [header].concat(lines).join('\n');
};

class ExportForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    client: PropTypes.object,
  };

  constructor(props) {
    super(props);

    // Calculate the start: first day of previous month & end date: today.
    const oneMonthAgo = moment().subtract(1, 'months')._d;
    const defaultStartDate = new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1);
    const defaultEndDate = new Date();

    this.state = {
      dateFrom: defaultStartDate,
      dateTo: defaultEndDate,
      data: [],
      downloadBtnDisabled: false,
      searchReturnedEmpty: false,
    };
  }

  async download() {
    const result = await this.props.client.query({
      query: getTransactionsQuery,
      variables: {
        CollectiveId: this.props.collective.id,
        dateFrom: this.state.dateFrom,
        dateTo: this.state.dateTo,
      },
    });
    const csv = transformResultInCSV(result.data.allTransactions);

    // Don't prompt the file download unless there's data coming
    if (csv === '') {
      this.setState({ searchReturnedEmpty: true });
      return;
    }

    // Helper to prepare date values to be part of the file name
    const format = d => moment(d).format('YYYYMMDDHHMMSS');
    let fileName = `${this.props.collective.slug}--`;
    fileName += `${format(this.state.dateFrom)}-`;
    fileName += `${format(this.state.dateTo)}.csv`;
    return exportFile('text/plain;charset=utf-8', fileName, csv);
  }

  updateSearchProps(entries) {
    this.setState(entries);
    this.setState({
      downloadBtnDisabled: !(this.state.dateFrom && this.state.dateTo),
    });
  }

  render() {
    return (
      <Popover id="csv-date-range" title="Download CSV file" {...this.props}>
        <style jsx global>
          {`
            .control-label {
              font-weight: 100;
              font-size: 14px;
            }
            .empty-search-error {
              padding-top: 10px;
              color: #e21a60;
            }
          `}
        </style>
        <InputField
          name="dateFrom"
          label="Start date"
          type="date"
          closeOnSelect
          defaultValue={this.state.dateFrom}
          onChange={dateFrom => this.updateSearchProps({ dateFrom })}
        />
        <InputField
          name="dateTo"
          label="End date"
          type="date"
          defaultValue={this.state.dateTo}
          closeOnSelect
          onChange={dateTo => this.updateSearchProps({ dateTo })}
        />
        <Button disabled={this.state.disabled} bsSize="small" bsStyle="primary" onClick={this.download.bind(this)}>
          Download
        </Button>
        {this.state.searchReturnedEmpty && (
          <div className="empty-search-error">
            <FormattedMessage
              id="transactions.emptysearch"
              defaultMessage="There are no transactions in this date range."
            />
          </div>
        )}
      </Popover>
    );
  }
}

const ExportFormWithClient = withApollo(ExportForm);

class PopoverButton extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
  };

  render() {
    const form = <ExportFormWithClient collective={this.props.collective} />;
    return (
      <OverlayTrigger trigger="click" placement="bottom" overlay={form} rootClose>
        <a className="download-csv" role="button" style={{ float: 'right', fontSize: '12px', padding: 7 }}>
          <FileDownload size="1.3em" />{' '}
          <FormattedMessage id="transactions.downloadcsvbutton" defaultMessage="Download CSV" />
        </a>
      </OverlayTrigger>
    );
  }
}

export default withIntl(PopoverButton);
