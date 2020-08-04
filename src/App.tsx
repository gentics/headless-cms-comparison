import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";
import "./App.css";
import CmsList from "./CmsList";
import CmsCardList from "./CmsCardList";
import CmsDetailView from "./CmsDetailView";
import { AppState, Cms, CmsData, FilterFieldSet } from "./Cms";
import CmsService from "./CmsService";
import FilterService from "./FilterService";
import deepcopy from "ts-deepcopy";
import Alert from "react-bootstrap/Alert";
import FilterPanel from "./FilterPanel";
import Analytics from "./Analytics";

function App() {
  const [appState, setAppState] = React.useState<AppState>();

  React.useEffect(() => {
    CmsService.getCmsData().then((cmsData: CmsData) => {
      setAppState(constructAppState(cmsData));
    });
  }, []);

  const updateFilterFields = function (updatedFilterFields: FilterFieldSet) {
    if (appState) {
      const updatedAppState = deepcopy<AppState>(appState);
      updatedAppState.filterResults = FilterService.filterCms(
        updatedFilterFields,
        appState.cmsData.cms
      );
      updatedAppState.filterFields.actual = updatedFilterFields;
      setAppState(updatedAppState);
    }
  };

  if (appState) {
    return (
      <Router>
        <div className="App">
          <header className="App-header" style={{ minHeight: "20rem" }}>
            <h1>Welcome to the headless CMS Comparison Website!</h1>
          </header>

          <Container fluid className="my-3">
            <Row>
              <Col>
                <Switch>
                  <Route exact path="/">
                    <Redirect to="/card" />
                  </Route>
                  <Route exact path="/card">
                    <Container fluid className="mt-3">
                      <Row>
                        <Col>
                          <Nav variant="pills" defaultActiveKey="/card">
                            <Nav.Item>
                              <Nav.Link as="span">
                                <Link to="/list">List View</Link>
                              </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                              <Nav.Link as="span">
                                <Link to="/card">Card View</Link>
                              </Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Col>
                        <Col></Col>
                      </Row>
                    </Container>
                    <FilterPanel
                      filterFields={appState.filterFields}
                      updateFilterFields={updateFilterFields}
                    />
                    <CmsCardList
                      filterResults={appState.filterResults}
                      cms={appState.cmsData.cms}
                    />
                  </Route>
                  <Route exact path="/list">
                    <Container fluid className="mt-3">
                      <Row>
                        <Col>
                          <Nav variant="pills" defaultActiveKey="/card">
                            <Nav.Item>
                              <Nav.Link as="span">
                                <Link to="/list">List View</Link>
                              </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                              <Nav.Link as="span">
                                <Link to="/card">Card View</Link>
                              </Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Col>
                        <Col></Col>
                      </Row>
                    </Container>
                    <CmsList cmsData={appState.cmsData} />
                  </Route>
                  <Route exact path="/detail">
                    <CmsDetailView
                      filterResults={appState.filterResults}
                      cmsData={appState.cmsData}
                    />
                  </Route>
                </Switch>
              </Col>
            </Row>
          </Container>
        </div>
        <Analytics />
      </Router>
    );
  } else {
    return <Alert variant="info">Loading CMS-Data...</Alert>;
  }
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
    filterFields: { actual: filterFields, untouched: untouchedFilterFields },
    filterResults: FilterService.getUnfilteredCms(cmsData.cms),
  };
  return appState;
}

export default App;