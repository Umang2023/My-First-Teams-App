import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import '../styles/design.css';
import img from '../images/img.png'
import logo from '../images/Logo.png'
const CreateRoom = (props) => {
    const [joinURL, setJoinURL] = useState('');
    function create() {
        const id = uuid();
        props.history.push(`/room/${id}`);
    }
    function join() {
        if (joinURL !== '') {
            let url1 = joinURL.slice(0, 5);
            let url2 = joinURL.slice(0, 4);
            if (url2 !== "http" && url1 !== "https") {
                alert("Invalid URL");
                window.location.replace('/');
            }
            else {
                window.location.replace(joinURL);
            }
        }
        else {
            alert("Invalid URL or Room Doesn't Exist");
            window.location.replace("/");
        }
    }
    return (
        <div className="Create-Room-div">
            <div className="img-div">
                <img
                    className="landing-img"
                    src={img}
                    alt="new"
                />
                {/* <img
                    className="logo"
                    src={logo}
                    alt="new"
                /> */}
            </div>
            <div className="Button-div">
                <button className="angled-gradient-button" onClick={create} style={{ height: '4rem', width: '60%' }}>Create room</button>
                <h4 style={{ fontFamily: "'Philosopher', sans-serif", color: 'white', marginLeft: '17%' }}>Or</h4>
                <div className="JoinRoom-div">
                    <input id="icon_telephone"
                        type="text"
                        placeholder="Enter the link"
                        onChange={(event) => { setJoinURL(event.target.value) }}></input>
                </div>
                <button className="angled-gradient-button" onClick={join} style={{ height: '4rem', width: '60%' }}>Join room</button>
            </div>
        </div>

    );
};

export default CreateRoom;
