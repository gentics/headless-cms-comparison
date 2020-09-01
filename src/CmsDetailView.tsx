import React from "react";
import {
  FilterFieldSet,
  FilterResult,
  Cms,
  ScoreValue,
  BasicField,
  ScoreField,
  CmsData,
  CategoryCmsProperty,
  CategoryField,
  PropertyType,
  BooleanCmsProperty,
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
  FiSlash,
} from "react-icons/fi";
import { GrLicense } from "react-icons/gr";
import { MdUpdate } from "react-icons/md";
import ProgressBar from "react-bootstrap/ProgressBar";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import deepcopy from "ts-deepcopy";
import CmsService from "./CmsService";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  TitleTemplate,
  BooleanPropertyTemplate,
  CmsTableData,
  sortData,
} from "./TableTemplates";

export default function CmsDetailView(props: {
  filterFields: FilterFieldSet;
  filterResults: FilterResult[];
  cmsData: CmsData;
}) {
  const { cmsKey } = useParams();
  let filterResult: FilterResult;
  let cms: Cms;

  if (cmsKey && props.cmsData[cmsKey]) {
    cms = props.cmsData[cmsKey];
    const filterResultIndex = props.filterResults.findIndex(
      (filterResult) => filterResult.cmsKey === cmsKey
    );
    filterResult = props.filterResults[filterResultIndex];
  } else {
    return (
      <Alert variant="warning">
        Invalid CMS key was given! Go back to the{" "}
        <Link to="/card">
          <Button>Card View</Button>
        </Link>{" "}
        and select a CMS!
      </Alert>
    );
  }

  const genericValues: CmsTableData = [];
  const categoryValues: { [category: string]: CmsTableData } = {};

  const basicFilterFields = props.filterFields.basic;
  Object.keys(basicFilterFields).forEach((key: string) => {
    const prop = cms.properties[key];
    if (prop) {
      if (prop.type === PropertyType.Boolean) {
        genericValues.push({
          name: {
            name: prop.name,
            description: basicFilterFields[key].description,
          },
          value: {
            name: prop.name,
            value: prop.value,
            info: prop.info,
          },
        });
      } else {
        const basicFilterSubFields: CategoryField = basicFilterFields[key];
        const catprop: CategoryCmsProperty = prop;
        const subFieldKeys = CmsService.getKeysOfSubFields(
          basicFilterFields[key]
        );
        subFieldKeys.forEach((subkey: string) => {
          const subprop: BooleanCmsProperty = catprop[subkey];
          if (subprop) {
            (categoryValues[prop.name] = categoryValues[prop.name] || []).push({
              name: {
                name: subprop.name,
                description: basicFilterSubFields[subkey].description,
              },
              value: {
                name: subprop.name,
                value: subprop.value,
                info: subprop.info,
              },
            });
          }
        });
      }
    }
  });

  const createCard = (name: string, values: CmsTableData): JSX.Element => (
    <div className="mb-5">
      <h5>{name || "General"} Features</h5>
      <Card>
        <DataTable value={values}>
          <Column
            header="Feature"
            field="name"
            sortable
            sortFunction={(e) => sortData(values, e)}
            body={TitleTemplate}
          />
          <Column
            header="Supported?"
            field="value"
            style={{ width: "20%", textAlign: "center" }}
            sortable
            sortFunction={(e) => sortData(values, e)}
            body={BooleanPropertyTemplate}
          />
        </DataTable>
      </Card>
    </div>
  );

  const genericCard = createCard("", genericValues);
  const categoryCards = Object.keys(categoryValues)
    .sort()
    .map(
      (categoryName: string): JSX.Element =>
        createCard(categoryName, categoryValues[categoryName])
    );

  return (
    <section id="detail-view" className="pb-5">
      <Container>
        <Row>
          <Col>
            <div className="text-left mb-5">
              <Link to="/card">
                {" "}
                <i className="pi pi-arrow-left"></i> Back to the overview
              </Link>
            </div>
            <Card className="p-2 d-flex flex-row justify-content-between">
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
            </Card>

            <PropertyList name={cms.name} filterResult={filterResult} />

            <h3 className="my-5" key="all">
              All Features of {cms.name}
            </h3>

            <Row>
              <Col>{genericCard}</Col>
              <Col>{categoryCards}</Col>
            </Row>

            <span className="lastUpdated">
              <MdUpdate className="mr-1" /> This information was last updated on{" "}
              {new Date(cms.lastUpdated).toDateString()}
            </span>
            <span></span>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

function PropertyList(props: { filterResult: FilterResult; name: string }) {
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
    requiredListItems.push(
      <RequiredSummaryListItem key="requiredSummary" {...props} />
    );
  }

  const niceToHaveListItems = constructResultListItems(
    categorizedProperties.niceToHave
  );

  if (niceToHaveListItems.length > 0) {
    niceToHaveListItems.push(
      <NiceToHaveSummaryListItem key="niceToHaveSummary" {...props} />
    );
  }

  return (
    <div>
      <h4
        key="required"
        style={{ display: requiredListItems.length > 0 ? "block" : "none" }}
      >
        Your required features of {props.name}
      </h4>
      <Card
        className="info-box my-5"
        style={{ display: requiredListItems.length > 0 ? "block" : "none" }}
      >
        <div className="p-datatable">
          <table>
            <thead className="p-datatable-thead">
              <tr>
                <th
                  className="p-sortable-column"
                  aria-sort="none"
                  style={{ width: "80%", textAlign: "left" }}
                >
                  <span className="p-column-title">Feature</span>
                </th>
                <th
                  className="p-sortable-column"
                  aria-sort="none"
                  style={{ width: "20%", textAlign: "center" }}
                >
                  <span className="p-column-title">Supported?</span>
                </th>
              </tr>
            </thead>
            <tbody>{requiredListItems}</tbody>
          </table>
        </div>
      </Card>

      <h4 key="nice-to-have" className="mb-5">
        Your nice-to-have features of {props.name}
      </h4>
      <Card
        className="info-box my-5"
        style={{ display: niceToHaveListItems.length > 0 ? "block" : "none" }}
      >
        <div className="p-datatable">
          <table>
            <thead className="p-datatable-thead">
              <tr>
                <th
                  className="p-sortable-column"
                  aria-sort="none"
                  style={{ width: "80%", textAlign: "left" }}
                >
                  <span className="p-column-title">Feature</span>
                </th>
                <th
                  className="p-sortable-column"
                  aria-sort="none"
                  style={{ width: "20%", textAlign: "center" }}
                >
                  <span className="p-column-title">Supported?</span>
                </th>
              </tr>
            </thead>
            <tbody>{niceToHaveListItems}</tbody>
          </table>
        </div>
      </Card>
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

function isScoreFilterProperty(x: BasicField): x is ScoreField {
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
      <ResultListItem key={hasKey} cmsHasProperty property={currentProperty} />
    );
  }

  const hasNotKeys = Object.keys(fieldSet.hasNot);
  for (const hasNotKey of hasNotKeys) {
    const currentProperty = fieldSet.hasNot[hasNotKey];
    listItems.push(
      <ResultListItem key={hasNotKey} property={currentProperty} />
    );
  }

  return listItems;
}

function ResultListItem(props: {
  property: ScoreField;
  cmsHasProperty?: boolean;
}) {
  const icon = props.cmsHasProperty ? <FiCheckCircle /> : <FiSlash />;
  return (
    <tr
      className="resultListItem"
      // variant={props.cmsHasProperty ? undefined : "light"}
    >
      <td style={{ width: "80%", textAlign: "left" }}>
        <span>{props.property.name}</span>
      </td>
      <td style={{ width: "20%", textAlign: "center" }}>{icon}</td>
    </tr>
  );
}

function RequiredSummaryListItem(props: { filterResult: FilterResult }) {
  return (
    <tr
    // variant={props.filterResult.satisfactory ? "success" : "warning"}
    >
      <td colSpan={2}>
        <h5 className="my-3 text-center">
          {props.filterResult.satisfactory ? <FiCheckCircle /> : <FiSlash />}{" "}
          {`CMS ${
            props.filterResult.satisfactory ? `satisfies` : `does not satisfy`
          } all your essential requirements.`}
        </h5>
      </td>
    </tr>
  );
}

function NiceToHaveSummaryListItem(props: { filterResult: FilterResult }) {
  return (
    <tr className="">
      <td colSpan={2}>
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
      </td>
    </tr>
  );
}
