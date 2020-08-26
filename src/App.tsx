import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import deepcopy from "ts-deepcopy";

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
import Analytics from "./Analytics";
import About from "./About";
import { ErrorBoundary } from "./ErrorBoundary";
import Header from "./template/Header";
import SmallHeader from "./template/SmallHeader";
import Navigation from "./template/Navigation";
import Footer from "./template/Footer";
import FilterAside from "./FilterAside";
import FilterMenu from "./FilterMenu";

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

  const toggleAside = (): void => {
    if (appState) {
      setAppState({ ...appState, showAside: !appState.showAside });
    }

    if (!appState?.showAside) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
  };

  const githubUrl = "https://github.com/gentics/headless-cms-comparison";
  const content = appState ? (
    <Router>
      <Navigation />

      <Switch>
        <Route exact path="/">
          <Redirect to="/card" />
        </Route>

        <Route exact path="/card">
          <FilterAside
            filterFields={appState.filterFields}
            updateFilterFields={updateFilterFields}
            showAside={appState.showAside}
            toggleAside={toggleAside}
          />
          <Header />
          <FilterMenu
            filterFields={appState.filterFields}
            updateFilterFields={updateFilterFields}
            toggleAside={toggleAside}
          />
          <main>
            <CmsCardList
              filterResults={appState.filterResults}
              cms={appState.cms}
            />
          </main>
        </Route>

        <Route exact path="/list">
          <SmallHeader title="List view" />

          <main>
            <CmsList
              filterFields={appState.filterFields.actual}
              cmsData={appState.cms}
            />
          </main>
        </Route>

        <Route path="/detail/:cmsKey">
          <SmallHeader title={appState.cms} />
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
          <main>
            <About url={githubUrl} />
          </main>
        </Route>
      </Switch>
      <Footer />
      <Analytics />
    </Router>
  ) : (
    ""
    // <Alert variant="info">Loading data...</Alert>
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
    showAside: false,
  };
  return appState;
}

export default App;
