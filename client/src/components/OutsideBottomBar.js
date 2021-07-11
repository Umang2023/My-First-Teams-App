import React from 'react';
import styled from 'styled-components';
import '../styles/design.css'
//Outside Room controls
const OutsideBottomBar = ({
    goToBack,
    toggleCameraAudio,
    userVideoAudio,
}) => {

    return (
        <div className="outside-bottom-bar-cont" >
            <Bar>
                <Center>
                    <CameraButton onClick={toggleCameraAudio} data-switch='video'>
                        <div>
                            {userVideoAudio.video ? (
                                <FaIcon className='fas fa-video'></FaIcon>
                            ) : (
                                <FaIcon className='fas fa-video-slash'></FaIcon>
                            )}
                        </div>
                        Camera
                    </CameraButton>

                    <CameraButton onClick={toggleCameraAudio} data-switch='audio'>
                        <div>
                            {userVideoAudio.audio ? (
                                <FaIcon className='fas fa-microphone'></FaIcon>
                            ) : (
                                <FaIcon className='fas fa-microphone-slash'></FaIcon>
                            )}
                        </div>
                        Audio
                    </CameraButton>
                </Center>
            </Bar>
        </div>
    );
};

const Bar = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  background-color: #3363ff;
  border-radius: 25px;
  margin-bottom: 20px;
`;

const Center = styled.div`

  flex: 1;
  display: flex;
  justify-content: center;
   background-color: #3363ff;
   border-radius: 25px;
`;

const FaIcon = styled.i`
  width: 30px;
  font-size: calc(16px + 1vmin);
`;


const CameraButton = styled.div`
  position: relative;
  width: 75px;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  .fa-microphone-slash {
    color: #ee2560;
  }

  .fa-video-slash {
    color: #ee2560;
  }
`;
export default OutsideBottomBar;