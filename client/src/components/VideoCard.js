import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
const VideoCard = (props) => {
  const ref = useRef();
  const peer = props.peer;

  useEffect(() => {
    peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
    peer.on('track', (track, stream) => {
    });
  }, [peer]);

  return (
    <Video
      playsInline
      autoPlay
      ref={ref}
    />
  );
};

const Video = styled.video`
border-radius: 5px`;

export default VideoCard;
