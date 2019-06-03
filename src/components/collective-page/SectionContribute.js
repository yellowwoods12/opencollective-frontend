import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';

import { H2, H3, P } from '../Text';
import StyledCard from '../StyledCard';
import StyledButton from '../StyledButton';

import tierCardDefaultImage from './TierCardDefaultImage.svg';
import StyledTag from '../StyledTag';
import withIntl from '../../lib/withIntl';

/** Tier card banner */
const TierBanner = styled.div`
  background-color: #f5f7fa;
  background-image: url(${tierCardDefaultImage});
  height: 135px;
  background-repeat: no-repeat;
  background-size: cover;
  padding: 16px;
`;

/** Translations */
const I18nContributionType = defineMessages({
  oneTime: {
    id: 'ContributionType.OneTime',
    defaultMessage: 'One time contribution',
  },
  recurring: {
    id: 'ContributionType.Recurring',
    defaultMessage: 'Recurring contribution',
  },
});

/**
 * The contribute section
 */
class SectionContribute extends React.PureComponent {
  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
  };

  render() {
    const { tiers, intl } = this.props;

    return (
      <Box pt={[6, null, null, null, 7]}>
        <Box m="0 auto" css={{ maxWidth: 1440 }}>
          <H2 mb={3} px={3} fontWeight="normal" color="black.900">
            <FormattedMessage id="CollectivePage.Contribute" defaultMessage="Contribute" />
          </H2>
          <H3 mb={3} px={3} fontSize="H5" fontWeight="normal" color="black.900">
            <FormattedMessage
              id="CollectivePage.FinancialContributor"
              defaultMessage="Become a financial contributor"
            />
          </H3>
          <Flex px={3}>
            <StyledCard width={264}>
              <TierBanner>
                <StyledTag
                  background="white"
                  border="1px solid #99CFFF"
                  color="primary.500"
                  borderRadius={100}
                  fontWeight="bold"
                  p="4px 8px"
                  fontSize="Tiny"
                  lineHeight="Tiny"
                >
                  {intl.formatMessage(I18nContributionType.oneTime)}
                </StyledTag>
              </TierBanner>
              <Flex px={3} py={3} flexDirection="column" justifyContent="space-between">
                <P fontSize="H5" mb={3} fontWeight="bold">
                  <FormattedMessage id="CollectivePage.OneTimeContribution" defaultMessage="One time contribution" />
                </P>
                <P mb={4} mt={2}>
                  <FormattedMessage
                    id="CollectivePage.OneTimeContribution.description"
                    defaultMessage="Not ready to go recurring, let’s go with a one time contribution!"
                  />
                </P>
                <StyledButton width={1}>
                  <FormattedMessage id="Tier.Contribute" defaultMessage="Contribute" />
                </StyledButton>
              </Flex>
            </StyledCard>
            {(this.props.tiers || []).map(tier => (
              <div key={tier.id}>Todo</div>
            ))}
          </Flex>
        </Box>
      </Box>
    );
  }
}

export default withIntl(SectionContribute);
