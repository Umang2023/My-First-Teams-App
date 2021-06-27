import React, { useEffect, useRef, useState } from "react";
import ReactDOM from 'react-dom';
import * as io from 'socket.io-client';
import Peer from "simple-peer";
import styled from "styled-components";
import '../styles/design.css';
import M from 'materialize-css'
import socket from "socket.io-client/lib/socket";

const Container = styled.div`
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    margin: auto;
    flex-wrap: wrap;
`;
const Button = styled.button`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: 50%;
    height: 3rem;
`
const StyledVideo = styled.video`
    width: 60%;
    height: 50%;
`;

const videoConstraints = {
    height: window.innerHeight,
    width: window.innerWidth,
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const localVideoRef = useRef();
    const roomID = props.match.params.roomID;
    const [inRoom, setInRoom] = useState(false);
    const [me, setMe] = useState('');
    // const peersRefdupl = useRef([]);
    const [localStream, setLocalStream] = useState();
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [otherUserVideo, setOtherUserVideo] = useState([]);
    const [otherUserAudio, setOtherUserAudio] = useState([]);
    let isVideoAvailable = true;
    let isAudioAvailable = true;
    useEffect(() => {
        socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            // window.localStream = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                console.log("existing users");
                const peers = [];
                console.log(users);
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({
                        peer,
                        peerID: userID,
                    });
                })
                setPeers(peers);
                setLocalStream(stream);
                setAudio(true);
                setVideo(true);
            })
            socketRef.current.on("me", (id) => { setMe(id) });
            socketRef.current.on("user joined", payload => {
                console.log("user joined");
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })
                const peerObj = {
                    peer,
                    peerID: payload.callerID,
                }
                setPeers(users => [...users, peerObj]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                console.log("receiving returned signal");
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("user left", (id) => {
                console.log("user left");
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) {
                    peerObj.peer.destroy();
                }
                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;
                setPeers(peers);
            })

            socketRef.current.on("updateUserMedia", ({ type, currentMediaStatus }) => {
                if (currentMediaStatus) {
                    if (type === "video") {
                        setVideo(currentMediaStatus);
                    }
                    else {
                        if (type === "mic") {
                            setAudio(currentMediaStatus);
                        }
                        else {
                            console.log("Unhandled event");
                        }
                    }
                }
            })
        })
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        console.log("Creating Peer ", userToSignal, callerID);
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })
        return peer;
    }
    const Video = (props) => {
        const ref = useRef();

        useEffect(() => {
            props.peer.on("stream", stream => {
                ref.current.srcObject = stream;
            })
        }, []);

        return (
            <div className="Video-div">
                <StyledVideo playsInline autoPlay ref={ref} />
            </div>

        );
    }
    // function UpdateUsersMedia()

    const updateVideo = () => {
        // setVideo((currentStatus) => {
        //     // socketRef.current.emit("updateMyMedia", {
        //     //     type: "video",
        //     //     currentMediaStatus: !currentStatus,
        //     // });

        if (OnAndOff()) {
            userVideo.current.srcObject.getVideoTracks()[0].enabled = !isVideoAvailable;
        }
        isVideoAvailable = !isVideoAvailable;
        // const stream = userVideo.current.srcObject;
        // setLocalStream(stream);
        // return !currentStatus;

    }
    const updateMic = () => {
        // setAudio((currentStatus) => {
        //     // socketRef.current.emit("updateMyMedia", {
        //     //     type: "mic",
        //     //     currentMediaStatus: !currentStatus,
        //     // });

        if (OnAndOff()) {
            userVideo.current.srcObject.getAudioTracks()[0].enabled = !isAudioAvailable;
        }
        isAudioAvailable = !isAudioAvailable;
    }

    function OnAndOff() {
        console.log(localStream);

        if (userVideo.current) {
            console.log(userVideo.current.srcObject);
            return true;
        }
        else {
            return false;
        }
    }
    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <div className="Room-div">
            {
                inRoom === true ? (
                    <div className="InRoom-div">
                        <div className="Video-div">
                            <StyledVideo muted ref={userVideo} autoPlay playsInline />
                            <div className="video-buttons">
                                <Button onClick={() => { updateVideo() }}> Turn Video On And Off</Button>
                                <Button onClick={() => { updateMic() }}> Turn Audio On And Off</Button>
                            </div>
                        </div>
                        {
                            peers.map((peer) => {
                                return (
                                    <Video key={peer.peerID} peer={peer.peer} />
                                );
                            })
                        }
                    </div>
                ) : (
                    <div className="NotInRoom-div">
                        <div className="Video-div">
                            <StyledVideo muted ref={userVideo} autoPlay playsInline />
                            <div className="video-buttons">
                                <Button onClick={() => { updateVideo() }}> Turn Video On And Off</Button>
                                <Button onClick={() => { updateMic() }}> Turn Audio On And Off</Button>
                            </div>
                        </div>
                        <div className="Button-div">
                            <Button onClick={() => { return (setInRoom(true)) }}>
                                Join Room
                            </Button>
                        </div>

                    </div>
                )
            }

        </div>
    );
};

export default Room;
