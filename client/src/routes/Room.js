import React, { useEffect, useRef, useState } from "react";
import ReactDOM from 'react-dom';
import { Redirect, useHistory } from "react-router-dom";
import * as io from 'socket.io-client';
import Peer from "simple-peer";
import styled from "styled-components";
import '../styles/design.css';
import M from 'materialize-css'
import socket from "socket.io-client/build/socket";
import logo from '../images/Logo.png'
const Button = styled.button`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: 50%;
    height: 4rem;
`

const Container = styled.div`
  height: 100vh;
  width: 20%;
`;

const StyledVideo = styled.video`
    border-radius: 10px;
    overflow: hidden;
    margin: 1px;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", (stream) => {
            ref.current.srcObject = stream;
        });
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
    )
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const [audioFlag, setAudioFlag] = useState(true);
    const [videoFlag, setVideoFlag] = useState(true);
    const [userUpdate, setUserUpdate] = useState([]);
    const [inRoom, setInRoom] = useState(false);
    const [chat, setChat] = useState([]);
    const [name, setName] = useState("");
    // const [isName, setisName] = useState(false);
    const [msgRcv, setMsgRcv] = useState("");
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    let isName = false;
    const videoConstraints = {
        minAspectRatio: 1.333,
        minFrameRate: 60,
        height: window.innerHeight,
        width: window.innerWidth,
    };
    useEffect(() => {
        // socketRef.current = io.connect("/", { transports: ["websocket"], upgrade: false });
        socketRef.current = io.connect("/");
        createStream();
    }, []);

    function createStream() {
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
            .then((stream) => {
                userVideo.current.srcObject = stream;
                socketRef.current.emit("join room", roomID);
                socketRef.current.on("all users", (users) => {
                    console.log(users)
                    const peers = [];
                    users.forEach((userID) => {
                        const peer = createPeer(userID, socketRef.current.id, stream);
                        peersRef.current.push({
                            peerID: userID,
                            peer,
                        });
                        peers.push({
                            peerID: userID,
                            peer,
                        });
                    });
                    setPeers(peers);
                });
                socketRef.current.on("user joined", (payload) => {
                    console.log("user joined", payload);
                    M.toast({ html: `${payload.callerID} joined`, classes: 'rounded' });
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    });
                    const peerObj = {
                        peer,
                        peerID: payload.callerID,
                    };
                    setPeers((users) => [...users, peerObj]);
                });

                socketRef.current.on("user left", (id) => {
                    M.toast({ html: `${id} left`, classes: 'rounded' });
                    const peerObj = peersRef.current.find((p) => p.peerID === id);
                    if (peerObj) {
                        peerObj.peer.destroy();
                    }
                    const peers = peersRef.current.filter((p) => p.peerID !== id);
                    peersRef.current = peers;
                    setPeers(peers);
                });

                socketRef.current.on("receiving returned signal", (payload) => {
                    const item = peersRef.current.find((p) => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                });

                socketRef.current.on("change", (payload) => {
                    setUserUpdate(payload);
                });

                socketRef.current.on("room full", () => {
                    alert("Room is Full");
                    window.location.replace("/");
                });

                // socketRef.current.on("msgRcv", ({ name, msg: value, sender }) => {
                //     setMsgRcv({ value, sender });
                //     setTimeout(() => {
                //         setMsgRcv({});
                //     }, 2000);
                // });
            });
    }
    // const sendMsg = (value) => {
    //     socketRef.current.emit("msgUser", { name, msg: value, sender: name });
    //     let msg = {};
    //     msg.msg = value;
    //     msg.type = "sent";
    //     msg.timestamp = Date.now();
    //     msg.sender = name;
    //     setChat([...chat, msg]);
    // };
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            socketRef.current.emit("sending signal", {
                userToSignal,
                callerID,
                signal,
            });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            socketRef.current.emit("returning signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    function UpdateVideo() {
        if (userVideo.current.srcObject) {
            userVideo.current.srcObject.getTracks().forEach(function (track) {
                if (track.kind === "video") {
                    if (track.enabled) {
                        socketRef.current.emit("change", [...userUpdate, {
                            id: socketRef.current.id,
                            videoFlag: false,
                            audioFlag,
                        }]);
                        track.enabled = false;
                        setVideoFlag(false);
                    } else {
                        socketRef.current.emit("change", [...userUpdate, {
                            id: socketRef.current.id,
                            videoFlag: true,
                            audioFlag,
                        }]);
                        track.enabled = true;
                        setVideoFlag(true);
                    }
                }
            });
        }
    }

    function UpdateAudio() {
        if (userVideo.current.srcObject) {
            userVideo.current.srcObject.getTracks().forEach(function (track) {
                if (track.kind === "audio") {
                    if (track.enabled) {
                        socketRef.current.emit("change", [...userUpdate, {
                            id: socketRef.current.id,
                            videoFlag,
                            audioFlag: false,
                        }]);
                        track.enabled = false;
                        setAudioFlag(false);
                    } else {
                        socketRef.current.emit("change", [...userUpdate, {
                            id: socketRef.current.id,
                            videoFlag,
                            audioFlag: true,
                        }]);
                        track.enabled = true;
                        setAudioFlag(true);
                    }
                }
            });
        }
    }

    function RemoveUser() {
        socketRef.current.disconnect();
        window.location.replace("/");
    }
    function CheckName() {
        if (isName === true) {
            return (setInRoom(true));
        }
        else {
            alert("Please Set Your Name");
        }
    }
    function DisplayUserName() {
        M.toast({ html: `Hello ${name}`, classes: 'rounded' });
        isName = true;
    }
    return (
        <div className="Room-div">
            {
                inRoom === true ?
                    (
                        <div className="InRoom-div">
                            <div id="item1" className="Video-div">
                                <StyledVideo muted ref={userVideo} autoPlay playsInline />
                            </div>
                            {
                                peers.map((peer, index) => {
                                    let audioFlagTemp = true;
                                    let videoFlagTemp = true;
                                    if (userUpdate) {
                                        userUpdate.forEach((entry) => {
                                            if (peer && peer.peerID && peer.peerID === entry.id) {
                                                audioFlagTemp = entry.audioFlag;
                                                videoFlagTemp = entry.videoFlag;
                                            }
                                        });
                                    }
                                    console.log(index);
                                    let temp = "item" + toString(index + 2);
                                    return (
                                        // <div key={peer.peerID} >
                                        <div id={temp} className="Video-div">
                                            <Video peer={peer.peer} />
                                        </div>
                                        // </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <div className="NotInRoom-div">
                            <div className="Outside-Video-div">
                                <StyledVideo muted ref={userVideo} autoPlay playsInline />
                            </div>
                            <div className="Joining-Options">
                                <div className="Button-div2">
                                    <Button className="angled-gradient-button" onClick={() => { CheckName() }}>
                                        Join Room
                                    </Button>
                                </div>
                                <div className="SetName-div">
                                    <input id="icon_telephone"
                                        type="text"
                                        placeholder="Enter your Name"
                                        onChange={(event) => { setName(event.target.value) }}></input>
                                </div>
                                <button className="angled-gradient-button" onClick={() => { DisplayUserName() }} style={{ height: '4rem', width: '50%' }}>Set this as my Name</button>
                            </div>

                        </div>
                    )
            }
            <div className="Footer">
                <div className="Controls">
                    {
                        videoFlag === true ?
                            (<i className="material-icons" style={{ cursor: 'pointer', color: 'white' }} onClick={() => {
                                UpdateVideo()
                            }}>videocam</i>)
                            :
                            (<i className="material-icons" style={{ cursor: 'pointer', color: 'red' }} onClick={() => {
                                UpdateVideo()
                            }}>videocam_off</i>)
                    }
                    &nbsp;&nbsp;&nbsp;
                    {
                        inRoom === true ?
                            (<i className="material-icons" style={{ cursor: 'pointer', color: 'red' }}
                                onClick={() => {
                                    RemoveUser()
                                }}
                            >call_end</i>)
                            :
                            (<div></div>)
                    }
                    &nbsp;&nbsp;&nbsp;
                    {
                        audioFlag === true ?
                            (<i className="material-icons" style={{ cursor: 'pointer', color: 'white' }} onClick={() => {
                                UpdateAudio()
                            }}>mic</i>)
                            :
                            (<i className="material-icons" style={{ cursor: 'pointer', color: 'red' }} onClick={() => {
                                UpdateAudio()
                            }}>mic_off</i>)
                    }

                </div>
            </div>
        </div>

    );
};

export default Room;
