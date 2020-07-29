import * as React from "react";
import {
  FilterResult,
  Cms,
  ScoreValue,
  BasicField,
  ScoreField,
} from "./Cms";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  FiCheckCircle,
  FiBox,
  FiPackage,
  FiAward,
  FiPower,
} from "react-icons/fi";
import { FiSlash } from "react-icons/fi";
import { GrLicense } from "react-icons/gr";
import { MdUpdate } from "react-icons/md";
import ListGroup from "react-bootstrap/ListGroup";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Link } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import deepcopy from "ts-deepcopy";
import CmsService from "./CmsService";

export default function CmsDetailView(props: any) {
  if (props.location.state) {
    console.log(props.location.state);
  } else {
    return (
      <Alert variant="info">
        Nothing to show! Please go back to <Link to="/card">the Card-List</Link>{" "}
        and select a CMS!
      </Alert>
    );
  }

  const cms: Cms =
    props.location.state.appState.cms[props.location.state.cmsKey];
  const filterResult: FilterResult = props.location.state.filterResult;

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <div className="d-inline-flex justify-content-between align-items-center w-100">
              <Link
                to={{ pathname: "/card", state: props.location.state.appState }}
              >
                <Button variant="dark">Back to results</Button>
              </Link>
              <h1>
                <b>
                  <i>{cms.name}</i>
                </b>
              </h1>
            </div>
            <hr />
            <div
              style={{ margin: "auto" }}
              className="d-flex justify-content-between"
            >
              <span className="specialProperty">
                <GrLicense /> {cms.license}
              </span>
              <span className="specialProperty">
                <FiBox /> {cms.category.toString()}
              </span>
              <span className="specialProperty">
                <FiPackage /> Version {cms.version}
              </span>
              <span className="specialProperty">
                <FiPower /> {cms.inception}
              </span>
            </div>
            <hr />
            <PropertyList filterResult={filterResult} />
            <span className="lastUpdated">
              <MdUpdate className="mr-1" /> This information was last updated on{" "}
              {new Date(cms.lastUpdated).toDateString()}
            </span>
            <span></span>
          </Col>
        </Row>
      </Container>
    </>
  );
}

function PropertyList(props: { filterResult: FilterResult }) {
  const hasProperties = categorizePropertiesByScores(
    props.filterResult.has.basic
  );

  const hasNotProperties = categorizePropertiesByScores(
    props.filterResult.hasNot.basic
  );

  let categorizedProperties: {
    required: {
      has: { [x: string]: ScoreField };
      hasNot: { [x: string]: ScoreField };
    };
    niceToHave: {
      has: { [x: string]: ScoreField };
      hasNot: { [x: string]: ScoreField };
    };
  } = {
    required: {
      has: hasProperties.required,
      hasNot: hasNotProperties.required,
    },
    niceToHave: {
      has: hasProperties.niceToHave,
      hasNot: hasNotProperties.niceToHave,
    },
  };

  const requiredListItems = constructResultListItems(
    categorizedProperties.required
  );

  if (requiredListItems.length > 0) {
    requiredListItems.push(<RequiredSummaryListItem {...props} />);
  }

  const niceToHaveListItems = constructResultListItems(
    categorizedProperties.niceToHave
  );

  if (niceToHaveListItems.length > 0) {
    niceToHaveListItems.push(<NiceToHaveSummaryListItem {...props} />);
  }

  return (
    <div>
      <ListGroup className="w-75 mx-auto">
        {requiredListItems}
        {niceToHaveListItems}
      </ListGroup>
    </div>
  );
}

function categorizePropertiesByScores(indexedPropertyArray: {
  [x: string]: BasicField;
}): {
  required: { [x: string]: ScoreField };
  niceToHave: { [x: string]: ScoreField };
} {
  let requiredProperties: { [x: string]: ScoreField } = {};
  let niceToHaveProperties: { [x: string]: ScoreField } = {};

  const indexedPropertyArrayCopy = deepcopy<{
    [x: string]: BasicField;
  }>(indexedPropertyArray);
  const propertyKeys = Object.keys(indexedPropertyArrayCopy);

  for (const propertyKey of propertyKeys) {
    const currentProperty = indexedPropertyArrayCopy[propertyKey];
    if (isScoreFilterProperty(currentProperty)) {
      currentProperty.value === ScoreValue.REQUIRED
        ? (requiredProperties[propertyKey] = currentProperty)
        : (niceToHaveProperties[propertyKey] = currentProperty);
    } else {
      const hasSubKeys = CmsService.getKeysOfSubFields(currentProperty);
      for (const subKey of hasSubKeys) {
        const currentSubProperty = currentProperty[subKey];
        currentSubProperty.name =
          currentProperty.name + ": " + currentSubProperty.name;
        currentSubProperty.value === ScoreValue.REQUIRED
          ? (requiredProperties[subKey] = currentSubProperty)
          : (niceToHaveProperties[subKey] = currentSubProperty);
      }
    }
  }
  return {
    required: requiredProperties,
    niceToHave: niceToHaveProperties,
  };
}

function isScoreFilterProperty(
  x: BasicField
): x is ScoreField {
  if (!x) return false;
  return x.value !== undefined;
}

function constructResultListItems(fieldSet: {
  has: { [x: string]: ScoreField };
  hasNot: { [x: string]: ScoreField };
}) {
  let listItems: JSX.Element[] = [];

  const hasKeys = Object.keys(fieldSet.has);
  for (const hasKey of hasKeys) {
    const currentProperty = fieldSet.has[hasKey];
    listItems.push(
      <ResultListItem cmsHasProperty property={currentProperty} />
    );
  }

  const hasNotKeys = Object.keys(fieldSet.hasNot);
  for (const hasNotKey of hasNotKeys) {
    const currentProperty = fieldSet.hasNot[hasNotKey];
    listItems.push(<ResultListItem property={currentProperty} />);
  }

  return listItems;
}

function ResultListItem(props: {
  property: ScoreField;
  cmsHasProperty?: boolean;
}) {
  const icon = props.cmsHasProperty ? <FiCheckCircle /> : <FiSlash />;
  return (
    <ListGroup.Item
      className="resultListItem"
      variant={props.cmsHasProperty ? undefined : "light"}
    >
      <span>{props.property.name}</span>
      {icon}
    </ListGroup.Item>
  );
}

function RequiredSummaryListItem(props: { filterResult: FilterResult }) {
  return (
    <ListGroup.Item
      variant={props.filterResult.satisfactory ? "success" : "warning"}
    >
      <h2 style={{ fontSize: "1.3em" }}>
        {props.filterResult.satisfactory ? <FiCheckCircle /> : <FiSlash />}{" "}
        {`CMS ${
          props.filterResult.satisfactory ? `satisfies` : `does not satisfy`
        } all essential requirements.`}
      </h2>
    </ListGroup.Item>
  );
}

function NiceToHaveSummaryListItem(props: { filterResult: FilterResult }) {
  return (
    <ListGroup.Item variant="info">
      <div className="d-inline-flex w-100 align-items-center">
        {props.filterResult.hasNiceToHaveShare > 0 ? (
          <FiAward style={{ marginRight: "0.5em", fontSize: "1.5em" }} />
        ) : (
          <FiSlash style={{ marginRight: "0.5em", fontSize: "1.5em" }} />
        )}{" "}
        <ProgressBar
          style={{ width: "100%" }}
          animated
          now={props.filterResult.hasNiceToHaveShare * 100}
          variant="info"
          label={`${(props.filterResult.hasNiceToHaveShare * 100).toFixed(0)}%`}
        />
      </div>
    </ListGroup.Item>
  );
}
