import * as React from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import CmsService from "./CmsService";
import FilterPanel from "./FilterPanel";

import { FilterResult, AppState } from "./Cms";

export default function CardList() {
  const [appState, setAppState] = React.useState<AppState>();

  React.useEffect(() => {
    console.log("Fetching...");
    CmsService.getCmsData().then((appState) => {
      setAppState(appState);
    });
  }, []);

  const updateCardList = function (appState: AppState) {
    setAppState(appState);
  };

  if (appState) {
    return (
      <div>
        <FilterPanel appState={appState} updateCardList={updateCardList} />
        {appState.filterResults ? (
          <div className="d-flex flex-wrap justify-content-center">
            <Cards appState={appState} />
          </div>
        ) : (
          <span></span>
        )}
      </div>
    );
  } else {
    return <Alert variant="info">Fetching CMS-Data...</Alert>;
  }
}

function Cards(props: { appState: AppState }) {
  const filterResults = props.appState.filterResults;
  const cms = props.appState.cms;

  if (filterResults.filter((result) => result.satisfactory).length > 0) {
    let cards: JSX.Element[] = [];
    // Sort after satisfactory boolean
    filterResults.sort(function (x: FilterResult, y: FilterResult) {
      return x.satisfactory === y.satisfactory ? 0 : x.satisfactory ? -1 : 1;
    }); // TODO: Move sorting to filterService
    filterResults.forEach((result) => {
      cards.push(
        <CmsCard
          key={result.cmsKey}
          name={cms[result.cmsKey].name}
          version={cms[result.cmsKey].version}
          satisfactory={result.satisfactory}
        />
      );
    });
    return <>{cards}</>;
  } else {
    return <NoResultsCard />;
  }
}

function CmsCard(props: {
  name: string;
  version: string;
  satisfactory: boolean;
}) {
  return (
    <div className={"my-2 mx-2"} key={props.name}>
      <Card
        style={{ width: "18rem" }}
        className={"cmsCard"}
        border={props.satisfactory ? "info" : undefined}
        bg={props.satisfactory ? undefined : "light"}
      >
        <Card.Body style={{ textAlign: "left" }}>
          <Card.Title>{props.name}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            Version {props.version}
          </Card.Subtitle>
        </Card.Body>
      </Card>
    </div>
  );
}

function NoResultsCard() {
  return (
    <div className={"my-2 mx-2 w-75"}>
      <Card  bg="light" border="dark">
        <Card.Body>
          <Card.Title><span role="img" aria-label="Not amused">😐</span> No CMS matches your requirements...</Card.Title>
          <Card.Text>
            Deselect some of the specified requirements and try again!
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}
