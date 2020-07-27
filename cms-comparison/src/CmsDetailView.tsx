import * as React from "react";
import {
  FilterResult,
  Cms,
  ScoreFilterProperty,
  ScoreValue,
  BasicFilterProperty,
  CategoryCmsProperty,
  CategoryFilterProperty,
} from "./Cms";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import { FiCheckCircle, FiBox, FiPackage } from "react-icons/fi";
import { FiSlash } from "react-icons/fi";
import { GrLicense } from "react-icons/gr";
import { BsGearWideConnected } from "react-icons/bs";

export default function CmsDetailView(props: any) {
  if (props.location.state) {
    console.log(props.location.state);
  }

  const cms: Cms =
    props.location.state.appState.cms[props.location.state.cmsKey];
  const filterResult: FilterResult = props.location.state.filterResult;

  const hasProperties = categorizeFilterPropertiesByScores(
    filterResult.has.basic
  );
  const hasNotProperties = categorizeFilterPropertiesByScores(
    filterResult.hasNot.basic
  );
  console.table(hasProperties);
  console.table(hasNotProperties);

  const satisfactoryText = `${cms.name} ${
    filterResult.satisfactory ? `satisfies` : `does not satisfy`
  } all essential requirements.`;

  return (
    <Container fluid>
      <Row>
        <Col>
          <h1>{cms.name}</h1>
          <hr />
          <div style={{margin: "auto"}} className="d-flex justify-content-between w-50">
            <span className="specialProperty"><GrLicense /> {cms.license}</span>
            <span className="specialProperty"><FiBox /> {cms.category.toString()}</span>
            <span className="specialProperty"><FiPackage /> Version {cms.version}</span>
          </div>
          <hr />
          <h4>
            {filterResult.satisfactory ? <FiCheckCircle /> : <FiSlash />}{" "}
            {satisfactoryText}
          </h4>
          <ul></ul>
        </Col>
      </Row>
    </Container>
  );
}

function categorizeFilterPropertiesByScores(indexedPropertyArray: {
  [x: string]: BasicFilterProperty;
}): { required: ScoreFilterProperty[]; niceToHave: ScoreFilterProperty[] } {
  let requiredProperties: ScoreFilterProperty[] = [];
  let niceToHaveProperties: ScoreFilterProperty[] = [];
  const propertyKeys = Object.keys(indexedPropertyArray);

  for (const propertyKey of propertyKeys) {
    const currentProperty = indexedPropertyArray[propertyKey];
    if (isScoreFilterProperty(currentProperty)) {
      currentProperty.value === ScoreValue.REQUIRED
        ? requiredProperties.push(currentProperty)
        : niceToHaveProperties.push(currentProperty);
    } else {
      const hasSubKeys = getSubPropertyKeys(currentProperty);
      for (const subKey of hasSubKeys) {
        const currentSubProperty = currentProperty[subKey];
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
