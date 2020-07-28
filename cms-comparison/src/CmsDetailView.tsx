import * as React from "react";
import {
  FilterResult,
  Cms,
  ScoreFilterProperty,
  ScoreValue,
  BasicFilterProperty,
  CategoryFilterProperty,
} from "./Cms";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FiCheckCircle, FiBox, FiPackage, FiAward, FiPower } from "react-icons/fi";
import { FiSlash } from "react-icons/fi";
import { GrLicense } from "react-icons/gr";
import { MdUpdate } from "react-icons/md";
import ListGroup from "react-bootstrap/ListGroup";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Link } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import TsDeepCopy from "ts-deepcopy";

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
              <h1><b><i>{cms.name}</i></b></h1>
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
                <MdUpdate className="mr-1"/> This information was last updated on {new Date(cms.lastUpdated).toDateString()}
              </span>
            <span></span>
          </Col>
        </Row>
      </Container>
    </>
  );
}

function categorizePropertiesByScores(indexedPropertyArray: {
  [x: string]: BasicFilterProperty;
}): { required: ScoreFilterProperty[]; niceToHave: ScoreFilterProperty[] } {
  let requiredProperties: ScoreFilterProperty[] = [];
  let niceToHaveProperties: ScoreFilterProperty[] = [];

  const indexedPropertyArrayCopy = TsDeepCopy<{[x: string]: BasicFilterProperty}>(indexedPropertyArray);
  const propertyKeys = Object.keys(indexedPropertyArrayCopy);

  for (const propertyKey of propertyKeys) {
    const currentProperty = indexedPropertyArrayCopy[propertyKey];
    if (isScoreFilterProperty(currentProperty)) {
      currentProperty.value === ScoreValue.REQUIRED
        ? requiredProperties.push(currentProperty)
        : niceToHaveProperties.push(currentProperty);
    } else {
      const hasSubKeys = getSubPropertyKeys(currentProperty);
      for (const subKey of hasSubKeys) {
        const currentSubProperty = currentProperty[subKey];
        currentSubProperty.name =
          currentProperty.name + ": " + currentSubProperty.name;
        currentSubProperty.value === ScoreValue.REQUIRED
          ? requiredProperties.push(currentSubProperty)
          : niceToHaveProperties.push(currentSubProperty);
      }
    }
  }
  return {
    required: requiredProperties,
    niceToHave: niceToHaveProperties,
  };
}

function isScoreFilterProperty(
  x: BasicFilterProperty
): x is ScoreFilterProperty {
  if (!x) return false;
  return x.value !== undefined;
}

function getSubPropertyKeys(property: CategoryFilterProperty): string[] {
  return Object.keys(property).filter(
    (key) => key !== "name" && key !== "description"
  );
}

function PropertyList(props: { filterResult: FilterResult }) {
  const hasProperties = categorizePropertiesByScores(
    props.filterResult.has.basic
  );

  const hasNotProperties = categorizePropertiesByScores(
    props.filterResult.hasNot.basic
  );

  const requiredProperties = {
    has: hasProperties.required,
    hasNot: hasNotProperties.required,
  };

  const requiredHasListItems = constructResultListItems(
    requiredProperties.has,
    true
  );
  const requiredHasNotListItems = constructResultListItems(
    requiredProperties.hasNot,
    false
  );

  const niceToHaveProperties = {
    has: hasProperties.niceToHave,
    hasNot: hasNotProperties.niceToHave,
  };

  const niceToHaveHasListItems = constructResultListItems(
    niceToHaveProperties.has,
    true
  );
  const niceToHaveHasNotListItems = constructResultListItems(
    niceToHaveProperties.hasNot,
    false
  );

  return (
    <div>
      <ListGroup className="w-75 mx-auto">
        {props.filterResult.hasRequiredShare !== -1 ? (
          <>
            {requiredHasListItems}
            {requiredHasNotListItems}
            <RequiredSummaryListItem {...props} />
          </>
        ) : (
          <></>
        )}

        {props.filterResult.hasNiceToHaveShare !== -1 ? (
          <>
            {niceToHaveHasListItems}
            {niceToHaveHasNotListItems}
            <NiceToHaveSummaryListItem {...props} />
          </>
        ) : (
          <></>
        )}
      </ListGroup>
    </div>
  );
}

function constructResultListItems(
  propertyArray: ScoreFilterProperty[],
  hasProperties: boolean
) {
  let listItems: JSX.Element[] = [];
  for (let i = 0; i < propertyArray.length; i++) {
    const currentProperty = propertyArray[i];
    listItems.push(
      <ResultListItem hasProperty={hasProperties} property={currentProperty} />
    );
  }
  return listItems;
}

function ResultListItem(props: {
  property: ScoreFilterProperty;
  hasProperty?: boolean;
}) {
  const icon = props.hasProperty ? <FiCheckCircle /> : <FiSlash />;
  return (
    <ListGroup.Item
      action
      className="resultListItem"
      variant={props.hasProperty ? undefined : "light"}
    >
      <span>{props.property.name}</span>
      {icon}
    </ListGroup.Item>
  );
}

function RequiredSummaryListItem(props: { filterResult: FilterResult }) {
  return (
    <ListGroup.Item
      action
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
    <ListGroup.Item action variant="info">
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
