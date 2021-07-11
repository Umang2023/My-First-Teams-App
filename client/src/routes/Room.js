import '../styles/design.css'
import M from 'materialize-css'
import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Peer from 'simple-peer';
import styled from 'styled-components';
import socket from '../socket';
import VideoCard from '../components/VideoCard';
import BottomBar from '../components/BottomBar';
import OutsideBottomBar from '../components/OutsideBottomBar';
import Chat from '../components/Chat';
import '../styles/design.css'

//Actual Video conference room
const Room = (props) => {
  //Getting username and defining react hooks
  const history = useHistory();
  const currentUser = sessionStorage.getItem('user');
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const roomId = props.match.params.roomId;
  const [inRoom, setInRoom] = useState(false);
  useEffect(() => {
    // Get Video Devices
    if (!currentUser) {
      const to = '/';
      M.toast({ html: `You must First set your name before joining a room`, classes: 'rounded toast-class' });
      setTimeout(() => history.push(to), 300);
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(filtered);
    });
    // Set Back Button Event
    window.addEventListener('popstate', goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit('join room', { roomId, userName: currentUser });
        socket.on('all users', (users) => {
          // all existing users
          const peers = [];
          users.forEach(({ userId, info }) => {
            let { userName, video, audio } = info;

            if (userName !== currentUser) {
              const peer = createPeer(userId, socket.id, stream);

              peer.userName = userName;
              peer.peerID = userId;

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              peers.push(peer);

              setUserVideoAudio((preList) => {
                return {
                  ...preList,
                  [peer.userName]: { video, audio },
                };
              });
            }
          });

          setPeers(peers);
        });
        //Adding new user in the room
        socket.on('user joined', ({ signal, from, info }) => {
          let { userName, video, audio } = info;
          const peerIdx = findPeer(from);

          if (!peerIdx) {
            const peer = addPeer(signal, from, stream);

            peer.userName = userName;

            peersRef.current.push({
              peerID: from,
              peer,
              userName: userName,
            });
            setPeers((users) => {
              return [...users, peer];
            });
            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });
        //Peer handshake
        socket.on('accepting signal', ({ signal, answerId }) => {
          const peerIdx = findPeer(answerId);
          peerIdx.peer.signal(signal);
        });
        //Disconnect event
        socket.on('user left', ({ userId, userName }) => {
          const peerIdx = findPeer(userId);
          if (peerIdx) {
            peerIdx.peer.destroy();
          }
          setPeers((users) => {
            users = users.filter((user) => user.peerID !== peerIdx.peer.peerID);
            return [...users];
          });
        });
      });
    //Cam on and off
    socket.on('change vid aud', ({ userId, switchTarget }) => {
      const peerIdx = findPeer(userId);
      if (!peerIdx) {
        return;
      }
      setUserVideoAudio((preList) => {
        let video = preList[peerIdx.userName].video;
        let audio = preList[peerIdx.userName].audio;

        if (switchTarget === 'video') video = !video;
        else audio = !audio;

        return {
          ...preList,
          [peerIdx.userName]: { video, audio },
        };
      });
    });

    return () => {
      socket.disconnect();
    };

  }, []);
  //Creating new peer connection
  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('add user', {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on('disconnect', () => {
      peer.destroy();
    });

    return peer;
  }
  //adding incoming peer connection 
  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('sending signal', { signal, to: callerId });
    });

    peer.on('disconnect', () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }
  //a utility function for finding peers
  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }
  //Creating video component of user's video
  function createUserVideo(peer, index, arr) {
    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? '' : peers.length}`}
        onClick={expandScreen}
        key={index}
      >
        {writeUserName(peer.userName)}
        <FaIcon className='fas fa-expand' />
        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }
  //When video turns off write user name
  function writeUserName(userName, index) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }

  // Open Chat
  const clickChat = (e) => {
    e.stopPropagation();
    setDisplayChat(!displayChat);
  };

  // BackButton
  const goToBack = (e) => {
    e.preventDefault();
    socket.emit('remove user', { roomId, user: currentUser });
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };
  //Microphone on and off
  const toggleCameraAudio = (e) => {
    const target = e.target.getAttribute('data-switch');

    setUserVideoAudio((preList) => {
      //getting audio and video status of local user
      let videoSwitch = preList['localUser'].video;
      let audioSwitch = preList['localUser'].audio;

      if (target === 'video') {
        const userVideoTrack = userVideoRef.current.srcObject.getVideoTracks()[0];
        videoSwitch = !videoSwitch;
        userVideoTrack.enabled = videoSwitch;
      } else {
        const userAudioTrack = userVideoRef.current.srcObject.getAudioTracks()[0];
        audioSwitch = !audioSwitch;

        if (userAudioTrack) {
          userAudioTrack.enabled = audioSwitch;
        } else {
          userStream.current.getAudioTracks()[0].enabled = audioSwitch;
        }
      }
      //updating the peers list
      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });
    //informing server which user's audio and video are changed
    socket.emit('change video audio', { roomId, switchTarget: target });
  };
  //screen sharing 
  const clickScreenSharing = () => {
    //getting screen stream using webrtc mediastream
    if (!screenShare) {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            // replacing tracks of video to those of stream
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === 'video'),
              screenTrack,
              userStream.current
            );
          });

          // updating tracks again
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track) => track.kind === 'video'),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  function reverse(s) {
    return [...s].reverse().join("");
  }
  //copy to clipboard
  function CopyToClipboard() {
    let text = window.location.href;
    let Room = "";
    for (let i = text.length - 1; i >= 0; --i) {
      if (text.charAt(i) == '/')
        break;
      Room += text.charAt(i);
    }
    Room = reverse(Room);
    try {
      navigator.clipboard.writeText(Room).then(() => {
        M.toast({ html: `Copied to clipboard`, classes: 'rounded toast-class' })
      })
    } catch (err) {
      M.toast({ html: `Couldn't Copy to clipboard`, classes: 'rounded toast-class' })
      console.log(err);
    }
  }

  //full screen
  const expandScreen = (e) => {
    const elem = e.target;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };
  //a utility function for switching between video devices
  const clickBackground = () => {
    if (!showVideoDevices) return;
    setShowVideoDevices(false);
  }

  return (
    <div>
      {
        inRoom === true ?
          (
            <RoomContainer onClick={clickBackground}>
              <VideoAndBarContainer>
                <VideoContainer>
                  {/* Current User Video */}
                  <VideoBox
                    className={`width-peer${peers.length > 8 ? '' : peers.length}`}
                  >
                    {userVideoAudio['localUser'].video ? null : (
                      <UserName>{currentUser}</UserName>
                    )}
                    <FaIcon className='fas fa-expand' />
                    <MyVideo
                      onClick={expandScreen}
                      ref={userVideoRef}
                      muted
                      autoPlay
                      playInline
                    ></MyVideo>
                  </VideoBox>
                  {/* Joined User Vidoe */}
                  {peers &&
                    peers.map((peer, index, arr) => createUserVideo(peer, index, arr))}
                </VideoContainer>
                <BottomBar
                  clickScreenSharing={clickScreenSharing}
                  clickChat={clickChat}
                  goToBack={goToBack}
                  toggleCameraAudio={toggleCameraAudio}
                  userVideoAudio={userVideoAudio['localUser']}
                  screenShare={screenShare}
                  videoDevices={videoDevices}
                  showVideoDevices={showVideoDevices}
                  setShowVideoDevices={setShowVideoDevices}
                  CopyToClipboard={CopyToClipboard}
                />
              </VideoAndBarContainer>
              <Chat display={displayChat} roomId={roomId} />
            </RoomContainer>
          )
          : (

            <RoomContainer onClick={clickBackground}>
              <VideoAndBarContainer>
                <VideoContainer>
                  {/* Current User Video */}
                  <VideoBox

                  >
                    {userVideoAudio['localUser'].video ? null : (
                      <UserName>{currentUser}</UserName>
                    )}
                    <FaIcon className='fas fa-expand' style={{ display: inRoom === true ? '' : 'none' }} />
                    <MyVideo
                      onClick={expandScreen}
                      ref={userVideoRef}
                      muted
                      autoPlay
                      playInline
                    ></MyVideo>
                    <Button className="angled-gradient-button" onClick={() => { setInRoom(true) }}>
                      Join Room
                    </Button>
                  </VideoBox>

                </VideoContainer>
                <OutsideBottomBar
                  goToBack={goToBack}
                  toggleCameraAudio={toggleCameraAudio}
                  userVideoAudio={userVideoAudio['localUser']}
                />
              </VideoAndBarContainer>

            </RoomContainer>
          )
      }
    </div>
  );
};

const RoomContainer = styled.div`
  display: flex;
  width: 100vw;
  max-height: 100vh;
  flex-direction: row;
`;

const VideoContainer = styled.div`
  max-width: 100%;
  height: 92%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  align-items: center;
  padding: 15px;
  box-sizing: border-box;
  gap: 10px;
  border-radius: 25px;
`;

const VideoAndBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`;

const MyVideo = styled.video``;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  > video {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 25px;
  }

  :hover {
    > i {
      display: block;
    }
  }
`;

const UserName = styled.div`
  position: absolute;
  font-size: calc(20px + 5vmin);
  z-index: 1;
`;

const FaIcon = styled.i`
  display: none;
  position: absolute;
  right: 15px;
  top: 15px;
`;
const Button = styled.button`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: 50%;
    height: 4rem;
    margin-left: 3rem;
`
export default Room;