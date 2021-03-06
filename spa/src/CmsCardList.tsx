import React from "react";
import Card from "react-bootstrap/Card";
import { GrLicense } from "react-icons/gr";
import { FiSlash, FiCheckCircle, FiAward, FiBox } from "react-icons/fi";
import classnames from "classnames";
import { FilterResult, Cms } from "./Cms";
import ProgressBar from "react-bootstrap/ProgressBar";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { LinkContainer } from "react-router-bootstrap";
import GithubRibbon from "./GithubRibbon";

export default function CardList(props: {
  filterResults: FilterResult[];
  cms: { [x: string]: Cms };
}) {
  return (
    <div className="container">
      <div className="cards">
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
    let cardNumber = 1;
    filterResults.forEach((result) => {
      cards.push(
        <CmsCard
          key={result.cmsKey}
          cms={cms[result.cmsKey]}
          filterResult={result}
          cardNumber={cardNumber}
        />
      );
      cardNumber++;
      if (cardNumber > 5) {
        cardNumber = 1;
      }
    });
    return <>{cards}</>;
  } else {
    return <NoResultsCard />;
  }
}

function satisfactoryResultsExist(filterResults: FilterResult[]) {
  return filterResults.some((result) => result.satisfactory);
}

function CmsTeaser(props: { cms: Cms }) {
  return <p>{props.cms.teaser.value}</p>;
}

function CmsCard(props: {
  cms: Cms;
  filterResult: FilterResult;
  cardNumber: number;
}) {
  const classes = classnames(
    "card",
    "card-line",
    `card-color-${props.cardNumber}`,
    { "card-deactivated": !props.filterResult.satisfactory }
  );
  return (
    <div className="mix">
      <div className={classes} key={props.filterResult.cmsKey}>
        <GithubRibbon cms={props.cms} />
        <LinkContainer
          to={`/detail/${props.filterResult.cmsKey}`}
          className="cmsCardLink"
        >
          <Card.Body className="text-left">
            <h2>{props.cms.name}</h2>
            <CmsCardText {...props} />

            <CmsTeaser cms={props.cms} />
          </Card.Body>
        </LinkContainer>
      </div>
    </div>
  );
}

function CmsCardText(props: { cms: Cms; filterResult: FilterResult }) {
  let cardListElements: JSX.Element[] = [];

  cardListElements.push(
    <li key={`${props.filterResult.cmsKey}_license`}>
      <GrLicense /> {props.cms.license.toString()}
    </li>
  );

  cardListElements.push(
    <li key={`${props.filterResult.cmsKey}_category`}>
      <FiBox /> {props.cms.category.toString()}
    </li>
  );

  if (props.filterResult.hasRequiredShare !== -1) {
    if (props.filterResult.hasRequiredShare === 1) {
      cardListElements.push(
        <li key={`${props.filterResult.cmsKey}_fulfill`}>
          <FiCheckCircle /> Fulfills all essential requirements
        </li>
      );
    } else if (props.filterResult.hasRequiredShare > 0) {
      cardListElements.push(
        <li key={`${props.filterResult.cmsKey}_fulfill`}>
          <FiSlash /> Fulfills only{" "}
          {(props.filterResult.hasRequiredShare * 100).toFixed(0)}% of the
          essential requirements
        </li>
      );
    } else {
      cardListElements.push(
        <li key={`${props.filterResult.cmsKey}_fulfill`}>
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
      <li key={`${props.filterResult.cmsKey}_niceToHaveShare`}>
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
    <div className="my-2 mx-2 w-75">
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
