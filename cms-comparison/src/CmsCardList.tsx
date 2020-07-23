import * as React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";
import Alert from "react-bootstrap/Alert";
import CmsService from "./CmsService";
import FilterPanel from "./FilterPanel";

// Icons
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillLike } from "react-icons/ai";
import { AiFillDislike } from "react-icons/ai";
import { AiFillStar } from "react-icons/ai";
import { FilterResult } from "./Cms";

export default function CardList() {
  const [cmsData, setCmsData] = React.useState<any>();
  const [results, setResults] = React.useState<any>(null);
  const [fetchError, setFetchError] = React.useState<any>(null);

  React.useEffect(() => {
    console.log("Fetching...");
    CmsService.getCmsData()
      .then(setCmsData)
      .catch((e) => {
        console.log("Error detected!");
        console.log(e);
        setFetchError(e);
      });
  }, []);

  React.useEffect(() => {
    console.log("Filter updated!");
    console.log(results);
  }, [results]);

  const setFilterResults = function (filterResults: FilterResult[]) {
    setResults(filterResults);
  };

  if (cmsData) {
    return (
      <div>
        <FilterPanel cmsData={cmsData} setFilterResults={setFilterResults} />
        {results ? (
          <div className="d-flex flex-wrap justify-content-center">
            {constructCards(results)}
          </div>
        ) : (
          <span></span>
        )}
      </div>
    );
  } else if (fetchError) {
    return (
      <Alert variant="danger">
        An error occurred while fetching: {fetchError.message}
      </Alert>
    );
  } else {
    return <ProgressBar animated now={100} />;
  }
}


function constructCards(filterResults: FilterResult[]): JSX.Element[] {
  if (filterResults.filter(result => result.satisfactory).length > 0) {
    let cards: JSX.Element[] = [];
    // Sort after satisfactory boolean
    filterResults.sort(function (x: FilterResult, y: FilterResult) {
      return x.satisfactory === y.satisfactory ? 0 : x.satisfactory ? -1 : 1;
    }); // TODO: Move sorting to filterService
    filterResults.forEach((result) => {
      cards.push(
        <CmsCard
          name={result.cms.name}
          version={result.cms.version}
          satisfactory={result.satisfactory}
        />
      );
    });
    return cards;
  } else {
    return [<NoResultsCard />];
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
          <Card.Text>
            {/*<ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {requiredText}
              {niceToHaveText}
            </ul>*/}
          </Card.Text>
          {/*progressBars*/}
          <div className="d-flex justify-content-start">
            <Button variant="info" disabled={!props.satisfactory}>Details</Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

function NoResultsCard() {
  return (
    <div className={"my-2 mx-2 w-75"}>
      <Card border="dark">
        <Card.Body>
          <Card.Title>😐 No CMS matches your requirements...</Card.Title>
          <Card.Text>
            Deselect some of the specified requirements and try again!
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}
