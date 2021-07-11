import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import socket from '../socket';
import img from '../images/img.png'
const Main = (props) => {
  const roomRef = useRef();
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');
//if user exists don't add him 
  useEffect(() => {
    socket.on('error user exists', ({ error }) => {
      if (!error) {
        const roomName = roomRef.current.value;
        const userName = userRef.current.value;

        sessionStorage.setItem('user', userName);
        props.history.push(`/room/${roomName}`);
      } else {
        setErr(error);
        setErrMsg('User name already exist');
      }
    });
  }, [props.history]);
//Joining room 
  function clickJoin() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg('Enter Room Name or User Name');
    } else {
      socket.emit('check user exists', { roomId: roomName, userName });
    }
  }

  return (
    <div className="home-div">
      <div className="img-div">
        <img
          className="landing-img"
          src={img}
          alt="new"
        />
      </div>
      <MainContainer>
        <Row>
          <Label htmlFor="roomName">Room Name : </Label>
          <Input type="text" id="roomName" ref={roomRef} />
        </Row>
        <Row>
          <Label htmlFor="userName" style={{ marginLeft: '13px' }}>User Name : </Label>
          <Input type="text" id="userName" ref={userRef} />
        </Row>
        <JoinButton className="angled-gradient-button" onClick={clickJoin}> Join </JoinButton>
        {err ? <Error>{errMsg}</Error> : null}
      </MainContainer>
    </div>

  );
};

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #000;
  padding: 20px;
  border-radius: 10px;
  margin-left: 5%;
  margin-right: 5%;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 15px;
  line-height: 35px;
  
`;

const Label = styled.label`
  font-size: 1.3rem;
  font-family: 'Philosopher', sans-serif;
  color:  #fff;
  `;

const Input = styled.input`
  width: 150px !important;
  height: 35px!important;
  margin-left: 20px!important;
  padding-left: 10px!important;
  border-radius: 10px!important;
  background: #fff !important;
  color:  #3363ff !important;
  font-family: 'Philosopher', sans-serif;
`;

const Error = styled.div`
  margin-top: 10px;
  font-size: 20px;
  color: #e85a71;
`;

const JoinButton = styled.button`
  display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: 50%;
    height: 4rem;
    background-color: white;
    color:  #3363ff;
    font-size: 1.3rem;
    margin-top: 2rem;
  :hover {
    background-color: #7bb1d1;
    cursor: pointer;
  }
`;

export default Main;
