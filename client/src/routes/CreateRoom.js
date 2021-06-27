import React from "react";
import { v1 as uuid } from "uuid";
import '../styles/design.css';
import img from '../images/img.png'
const CreateRoom = (props) => {
    function create() {
        const id = uuid();
        props.history.push(`/room/${id}`);
    }

    return (
        <div className="Create-Room-div">
            <div className="img-div">
                <img
                    src={img}
                    alt="new"
                />
            </div>
            <div className="Button-div">
                <button className="angled-gradient-button" onClick={create} style={{height: '4rem', width:'60%'}}>Create room</button>
            </div>

        </div>

    );
};

export default CreateRoom;
