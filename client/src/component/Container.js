import React from 'react';
import Board from './board';
import '../styles/design.css'

class Container extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            color: "#000000",
            size: "5"
        }
    }

    changeColor(params) {
        this.setState({
            color: params.target.value
        })
    }

    changeSize(params) {
        this.setState({
            size: params.target.value
        })
    }

    render() {

        return (
            <div className="container">
                <div className="tools-section">
                    <div className="color-picker-container">
                        Select Brush Color : &nbsp;
                        <input type="color" value={this.state.color} onChange={this.changeColor.bind(this)} style={{height: '2rem', width: '2rem'}}/>
                    </div>
                </div>
                <div className="outer-board-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '90%', height:'90%'}}>
                    <div className="board-container">
                        <Board color={this.state.color} size={this.state.size}></Board>
                    </div>
                </div>
                
            </div>
        )
    }
}

export default Container