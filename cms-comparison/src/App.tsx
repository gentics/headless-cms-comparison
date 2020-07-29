import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import "./App.css";

import CmsList from "./CmsList";
import CmsCardList from "./CmsCardList";
import CmsDetailView from "./CmsDetailView";
import {
  AppState,
  Cms,
  Category,
  License,
  BasicField,
  CmsData,
  Field,
  SpecialField,
  FilterFieldSet,
} from "./Cms";
import CmsService from "./CmsService";
import FilterService from "./FilterService";
import deepcopy from "ts-deepcopy";

function App() {
  const [appState, setAppState] = React.useState<AppState>();

  React.useEffect(() => {
    CmsService.getCmsData().then((cmsData: CmsData) => {
      setAppState(constructAppState(cmsData));
    });
  }, []);

  return (
    <Router>
      <div className="App">
        {/*<header className="App-header">
          <h1>Welcome to the headless CMS Comparison Website!</h1>
        </header>*/}

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

function constructAppState(cmsData: {
  fields: { [x: string]: any };
  cms: { [x: string]: Cms };
}): AppState {
  const filterFields: FilterFieldSet = { basic: {}, special: {} };
  filterFields.basic = FilterService.initializeBasicFields(
    cmsData.fields.properties
  );
  filterFields.special = FilterService.initializeSpecialFields();

  const untouchedFilterFields = deepcopy<FilterFieldSet>(filterFields);

  const appState: AppState = {
    cmsData: cmsData,
    filterFields: filterFields,
    untouchedFilterFields: untouchedFilterFields,
    filterResults: FilterService.getUnfilteredCms(cmsData.cms),
  };
  return appState;
}

export default App;
