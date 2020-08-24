import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import deepcopy from "ts-deepcopy";
import Alert from "react-bootstrap/Alert";

import "primereact/resources/themes/nova-light/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./App.css";

import CmsList from "./CmsList";
import CmsCardList from "./CmsCardList";
import CmsDetailView from "./CmsDetailView";
import { AppState, Cms, FilterFieldSet, ReceivedCmsData } from "./Cms";
import CmsService from "./CmsService";
import FilterService from "./FilterService";
import FilterPanel from "./FilterPanel";
import Analytics from "./Analytics";
import GithubRibbon from "./GithubRibbon";
import About from "./About";
import { ErrorBoundary } from "./ErrorBoundary";

function App() {
  const [appState, setAppState] = React.useState<AppState>();

  React.useEffect(() => {
    CmsService.getCmsData().then((cmsData: ReceivedCmsData) => {
      setAppState(constructAppState(cmsData));
    });
  }, []);

  const updateFilterFields = (updatedFilterFields: FilterFieldSet): void => {
    if (appState) {
      const updatedAppState = deepcopy<AppState>(appState);
      updatedAppState.filterResults = FilterService.filterCms(
        updatedFilterFields,
        appState.cms
      );
      updatedAppState.filterFields.actual = updatedFilterFields;
      setAppState(updatedAppState);
    }
  };

  const githubUrl = "https://github.com/gentics/headless-cms-comparison";

  const menu = (
    <Container fluid className="mt-3">
      <Row>
        <Col>
          <Nav variant="tabs" defaultActiveKey="/card">
            <Nav.Item>
              <LinkContainer to="/card">
                <Button>Card View</Button>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/list">
                <Button>List View</Button>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/about">
                <Button>About</Button>
              </LinkContainer>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>
    </Container>
  );

  const content = appState ? (
    <Router>
      <Switch>
        <Route exact path="/">
          <Redirect to="/card" />
        </Route>

        <Route exact path="/card">
          {menu}
          <FilterPanel
            filterFields={appState.filterFields}
            updateFilterFields={updateFilterFields}
          />
          <CmsCardList
            filterResults={appState.filterResults}
            cms={appState.cms}
          />
        </Route>

        <Route exact path="/list">
          {menu}
          <CmsList
            filterFields={appState.filterFields.actual}
            cmsData={appState.cms}
          />
        </Route>

        <Route path="/detail/:cmsKey">
          <CmsDetailView
            filterFields={appState.filterFields.actual}
            filterResults={appState.filterResults}
            cmsData={appState.cms}
          />
        </Route>

        <Route exact path="/about">
          {menu}
          <About url={githubUrl} />
        </Route>
      </Switch>

      <Analytics />
    </Router>
  ) : (
    <Alert variant="info">Loading data...</Alert>
  );

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: "20rem" }}>
        <GithubRibbon url={githubUrl} />
        <h1>
          Welcome to the <em>Headless CMS Comparison Website</em>
        </h1>
        <h2>Find the perfect headless CMS for your requirements!</h2>
      </header>

      <Container fluid className="my-3">
        <Row>
          <Col>
            <ErrorBoundary>{content}</ErrorBoundary>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

function constructAppState(cmsData: {
  fields?: { [x: string]: any };
  cms: { [x: string]: Cms };
}): AppState {
  const filterFields: FilterFieldSet = { basic: {}, special: {} };
  filterFields.basic = FilterService.initializeBasicFields(
    cmsData.fields?.properties
  );
  filterFields.special = FilterService.initializeSpecialFields();

  const untouchedFilterFields = deepcopy<FilterFieldSet>(filterFields);

  const appState: AppState = {
    cms: cmsData.cms,
    filterFields: { actual: filterFields, untouched: untouchedFilterFields },
    filterResults: FilterService.getUnfilteredCms(cmsData.cms),
  };
  return appState;
}

export default App;
