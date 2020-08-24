import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import deepcopy from "ts-deepcopy";
import Alert from "react-bootstrap/Alert";

import "./css/style.scss";
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
import About from "./About";
import { ErrorBoundary } from "./ErrorBoundary";
import Header from "./template/Header";
import SmallHeader from "./template/SmallHeader";
import Navigation from "./template/Navigation";
import Menu from "./template/Menu";
import Footer from "./template/Footer";

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
  const content = appState ? (
    <Router>
      <Navigation />

      <Switch>
        <Route exact path="/">
          <Header />
          <Menu />
          <main>
            <Redirect to="/card" />
          </main>
        </Route>

        <Route exact path="/card">
          <Header />
          <Menu />
          <main>
            <CmsCardList
              filterResults={appState.filterResults}
              cms={appState.cms}
            />
          </main>
        </Route>

        <Route exact path="/list">
          <SmallHeader title="List view" />
          <Menu />
          <main>
            <CmsList
              filterFields={appState.filterFields.actual}
              cmsData={appState.cms}
            />
          </main>
        </Route>

        <Route path="/detail/:cmsKey">
          <SmallHeader title="" />
          <Menu />
          <main>
            <CmsDetailView
              filterFields={appState.filterFields.actual}
              filterResults={appState.filterResults}
              cmsData={appState.cms}
            />
          </main>
        </Route>

        <Route exact path="/about">
          <SmallHeader title="About us" />
          <Menu />
          <main>
            <About url={githubUrl} />
          </main>
        </Route>
      </Switch>
      <Footer />
      <Analytics />
    </Router>
  ) : (
    <Alert variant="info">Loading data...</Alert>
  );

  return (
    <div className="App">
      <ErrorBoundary>{content}</ErrorBoundary>
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
