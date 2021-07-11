import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateRoom from './routes/CreateRoom';
import Room from './routes/Room'
import styled from 'styled-components';

function App() {
  return (
    <BrowserRouter>
      <AppContainer>
        <Switch>
          <Route exact path="/" component={CreateRoom} />
          <Route exact path="/room/:roomId" component={Room} />
        </Switch>
      </AppContainer>
    </BrowserRouter>
  );
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  font-size: calc(8px + 2vmin);
  color: white;
  background-image: linear-gradient(-90deg, #23073d, #7f23d5, #8523d5);
  background-repeat: no-repeat;
  background-position: center;
  text-align: center;
`;

export default App;
