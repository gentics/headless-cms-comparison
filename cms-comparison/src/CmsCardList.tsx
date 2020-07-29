import * as React from "react";
import Card from "react-bootstrap/Card";
import { GrLicense } from "react-icons/gr";

import { FiSlash, FiCheckCircle, FiAward, FiBox } from "react-icons/fi";
import { FilterResult, Cms, PanelSettings } from "./Cms";
import ProgressBar from "react-bootstrap/ProgressBar";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import { Link } from "react-router-dom";

export default function CardList(props: {
  filterResults: FilterResult[];
  cms: { [x: string]: Cms };
}) {
  return (
    <div>
      {/*<FilterPanel appState={appState} updateCardList={updateFilterFields} />*/}
      <div className="d-flex flex-wrap justify-content-center">
        <Cards {...props} />
      </div>
    </div>
  );
}

function Cards(props: {
  filterResults: FilterResult[];
  cms: { [x: string]: Cms };
}) {
  const filterResults = props.filterResults;
  const cms = props.cms;

  if (satisfactoryResultsExist(filterResults)) {
    let cards: JSX.Element[] = [];
    filterResults.forEach((result) => {
      cards.push(<CmsCard cms={cms[result.cmsKey]} filterResult={result} />);
    });
    return <>{cards}</>;
  } else {
    return <NoResultsCard />;
  }
}

function satisfactoryResultsExist(filterResults: FilterResult[]) {
  return filterResults.some((result) => result.satisfactory);
}

function CmsCard(props: { cms: Cms; filterResult: FilterResult }) {
  return (
    <div className={"my-2 mx-2"} key={props.filterResult.cmsKey}>
      <Link to="/detail" className="cmsCardLink">
        <Card
          style={{ width: "20rem" }}
          className={"cmsCard"}
          border={props.filterResult.satisfactory ? "info" : undefined}
          bg={props.filterResult.satisfactory ? undefined : "light"}
        >
          <Card.Body style={{ textAlign: "left" }}>
            <Card.Title>{props.cms.name}</Card.Title>
            <Card.Text>
              <CmsCardText {...props} />
            </Card.Text>
          </Card.Body>
        </Card>
      </Link>
    </div>
  );
}

function CmsCardText(props: { cms: Cms; filterResult: FilterResult }) {
  let cardListElements: JSX.Element[] = [];

  cardListElements.push(
    <li>
      <GrLicense /> {props.cms.license.toString()}
    </li>
  );

  cardListElements.push(
    <li>
      <FiBox /> {props.cms.category.toString()}
    </li>
  );

  if (props.filterResult.hasRequiredShare !== -1) {
    if (props.filterResult.hasRequiredShare === 1) {
      cardListElements.push(
        <li>
          <FiCheckCircle /> Fulfills all essential requirements
        </li>
      );
    } else if (props.filterResult.hasRequiredShare > 0) {
      cardListElements.push(
        <li>
          <FiSlash /> Fulfills only{" "}
          {(props.filterResult.hasRequiredShare * 100).toFixed(0)}% of the
          essential requirements
        </li>
      );
    } else {
      cardListElements.push(
        <li>
          <FiSlash /> Fulfills none of the essential requirements
        </li>
      );
    }
  }

  if (
    props.filterResult.satisfactory &&
    props.filterResult.hasNiceToHaveShare !== -1
  ) {
    cardListElements.push(
      <li>
        <OverlayTrigger
          placement="bottom"
          delay={{ show: 100, hide: 200 }}
          overlay={renderNiceToHaveProgressBarTooltip(
            props.filterResult.cmsKey,
            props.filterResult.hasNiceToHaveShare
          )}
        >
          <div className="d-inline-flex w-100">
            <FiAward style={{ marginRight: "0.5em" }} />
            <ProgressBar
              style={{ width: "100%" }}
              animated
              now={props.filterResult.hasNiceToHaveShare * 100}
              variant="info"
            />
          </div>
        </OverlayTrigger>
      </li>
    );
  }

  return (
    <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
      {cardListElements}
    </ul>
  );
}

function renderNiceToHaveProgressBarTooltip(cmsKey: string, share: number) {
  let barText: string;
  if (share === 1) {
    barText = "Has all nice-to-have properties";
  } else if (share > 0) {
    barText =
      "Has " + (share * 100).toFixed(0) + "% of nice-to-have properties";
  } else {
    barText = "Has no nice-to-have properties";
  }
  return <Tooltip id={`Tooltip_ProgressBar_${cmsKey}`}>{barText}</Tooltip>;
}

function NoResultsCard() {
  return (
    <div className={"my-2 mx-2 w-75"}>
      <Card bg="light" border="dark">
        <Card.Body>
          <Card.Title>
            <span role="img" aria-label="Not amused">
              😐
            </span>{" "}
            No CMS matches your requirements...
          </Card.Title>
          <Card.Text>
            Deselect some of the specified requirements and try again!
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}
