import React from 'react';
import styled, { css } from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { themeGet } from 'styled-system';
import { Flex, Box } from '@rebass/grid';

import { VideoPlus } from 'styled-icons/boxicons-regular/VideoPlus';
import { ArrowUpCircle } from 'styled-icons/feather/ArrowUpCircle';

import { fadeIn, fadeInUp } from './StyledKeyframes';
import { P } from './Text';
import StyledInput from './StyledInput';
import StyledButton from './StyledButton';
import VideoPlayer, { supportedVideoProviders } from './VideoPlayer';
import Container from './Container';

const VideoPlaceholder = styled(({ children, ...props }) => (
  <div {...props}>
    <div>{children}</div>
  </div>
))`
  /** Main-container, sized with padding-bottom to be 16:9 */
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; // 16:9 aspect ratio equivalant (9/16 === 0.5625)
  background: ${themeGet('colors.black.50')};
  color: ${themeGet('colors.black.300')};

  /** Flex container to center the content */
  & > div {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 16px;
  }

  ${props =>
    props.isClickable &&
    css`
      cursor: pointer;
      &:hover {
        color: ${themeGet('colors.black.400')};
      }
    `}
`;

/** A container for the form used to animate the different inputs */
const MainFormContainer = styled.div`
  button {
    animation: ${fadeIn} 0.3s;
  }

  input {
    animation: ${fadeInUp} 0.5s;
  }
`;

/**
 * A video placeholder that user can click on to upload a new video
 */
const VideoLinkerBox = () => {
  const [isEditing, setEditing] = React.useState(false);
  const [url, setUrl] = React.useState('');

  return !isEditing ? (
    <VideoPlaceholder isClickable onClick={() => setEditing(true)}>
      <VideoPlus size="50%" />
      <P fontWeight="bold" fontSize="LeadParagraph">
        <FormattedMessage id="VideoLinkerBox.AddVideo" defaultMessage="Add a video" />
      </P>
    </VideoPlaceholder>
  ) : (
    <MainFormContainer>
      <Container position="absolute" width={1} top={-45}>
        <StyledInput
          type="url"
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={url}
          onChange={e => setUrl(e.target.value)}
          width={1}
          mb={2}
          autoFocus
        />
      </Container>
      <Box width={1} maxHeight={400} mb={2}>
        <VideoPlayer
          url={url}
          placeholder={
            <VideoPlaceholder>
              <ArrowUpCircle size="50%" />
              <P fontWeight="bold" fontSize="LeadParagraph" textAlign="center" color="black.400" mt={2}>
                <FormattedMessage
                  id="VideoLinkerBox.SetUrl"
                  defaultMessage="Set the video URL above. We support the following platforms: {supportedVideoProviders}"
                  values={{ supportedVideoProviders: supportedVideoProviders.join(', ') }}
                />
              </P>
            </VideoPlaceholder>
          }
        />
      </Box>
      <Flex justifyContent="space-evenly">
        <StyledButton
          buttonSize="large"
          textTransform="capitalize"
          onClick={() => {
            setUrl('');
            setEditing(false);
          }}
        >
          <FormattedMessage id="form.cancel" defaultMessage="cancel" />
        </StyledButton>
        <StyledButton buttonSize="large" textTransform="capitalize" buttonStyle="primary">
          <FormattedMessage id="save" defaultMessage="save" />
        </StyledButton>
      </Flex>
    </MainFormContainer>
  );
};

export default VideoLinkerBox;
