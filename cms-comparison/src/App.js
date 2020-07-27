import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.light.css";
import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import "./App.css";

import CmsList from "./CmsList";
import CmsCardList from "./CmsCardList";
import CmsDetailView from "./CmsDetailView";

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Welcome to the headless CMS Comparison Website!</h1>
        </header>

        <Container fluid className="mt-3">
          <Row>
            <Col>
              <Nav variant="pills" defaultActiveKey="/home">
                <Nav.Item>
                  <Nav.Link>
                    <Link to="/list">List View</Link>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>
                    <Link to="/card">Card View</Link>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col></Col>
          </Row>
        </Container>
        <Container fluid className="my-3">
          <Row>
            <Col>
              <Switch>
                <Route exact path="/card" component={CmsCardList} />
                <Route exact path="/list" component={CmsList} />
                <Route exact path="/detail" component={CmsDetailView} />
              </Switch>
            </Col>
          </Row>
        </Container>
      </div>
    </Router>
  );
}

export default App;
