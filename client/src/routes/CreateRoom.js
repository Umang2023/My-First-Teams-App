import React from "react";
import { v1 as uuid } from "uuid";
import '../styles/design.css'
const CreateRoom = (props) => {
    function create() {
        const id = uuid();
        props.history.push(`/room/${id}`);
    }

    return (
        <div className="Create-Room-div">
            <button onClick={create}>Create room</button>
        </div>

    );
};

export default CreateRoom;
