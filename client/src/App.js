import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import Container from './component/Container';
// import SketchFieldDemo from './component/whiteboard'
function App() {
  return (
    <BrowserRouter>
      {/* <Navbar></Navbar> */}
      <Switch>
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room/:roomID" component={Room} />
        {/* <Route path="/" component={Container} /> */}
      </Switch>
    </BrowserRouter>
  );
}

export default App;
