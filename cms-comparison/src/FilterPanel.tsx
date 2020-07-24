import * as React from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { AiFillInfoCircle } from "react-icons/ai";
import deepcopy from "ts-deepcopy";

import {
  ScoreValue,
  FilterPropertySet,
  BasicFilterProperty,
  CategoryFilterProperty,
  ScoreFilterProperty,
  SpecialFilterProperty,
  AppState,
} from "./Cms";

import FilterService from "./FilterService";

export default function FilterPanel(props: {
  appState: AppState;
  updateCardList: (updatedAppState: AppState) => void;
}) {
  const clearPanel = (e: any, appState: AppState) => {
    const updatedAppState = deepcopy<AppState>(appState);
    updatedAppState.filterProperties = appState.unchangedFilterProperties;
    updatedAppState.showModifiedOnly = false;
    updatedAppState.propertyFilterString = "";
    updatedAppState.filterResults = FilterService.getUnfilteredCms(appState.cms);
    props.updateCardList(updatedAppState);
  };

  const handleChange = (
    event: any,
    appState: AppState,
    topKey?: string,
    subKey?: string,
    checkboxValue?: string
  ) => {
    // Clone object, otherwise react won't re-render
    const updatedAppState = Object.assign({}, appState);

    if (topKey) {
      if (subKey) {
        (updatedAppState.filterProperties.basic[
          topKey
        ] as CategoryFilterProperty)[subKey].value = event.target.value;
      } else {
        (updatedAppState.filterProperties.basic[
          topKey
        ] as ScoreFilterProperty).value = event.target.value;
      }
    } else {
      if (event.target.name === "showModifiedOnly") {
        updatedAppState.showModifiedOnly = event.target.checked;
      } else if (event.target.name === "propertyFilterString") {
        updatedAppState.propertyFilterString = event.target.value;
      } else if (checkboxValue) {
        const propertyName = event.target.name;
        const valueArray: any[] =
          updatedAppState.filterProperties.special[propertyName].value;
        if (event.target.checked) {
          if (!valueArray.includes(checkboxValue)) {
            valueArray.push(checkboxValue);
          }
        } else {
          const valueIndex = valueArray.indexOf(checkboxValue);
          if (valueIndex !== -1) {
            valueArray.splice(valueIndex, 1);
          }
        }
        updatedAppState.filterProperties.special[
          propertyName
        ].value = valueArray;
      } else {
        throw new Error(
          `Call by ${event.target.name} is illegal. handleChange() has nothing to handle!`
        );
      }
    }
    updatedAppState.filterResults = FilterService.filterCms(
      updatedAppState.filterProperties,
      updatedAppState.cms
    );
    props.updateCardList(updatedAppState);
  };

  return (
    <Panel
      appState={props.appState}
      changeHandler={handleChange}
      clearPanel={clearPanel}
    />
  );
}

function isScoreFilterProp(x: BasicFilterProperty): x is ScoreFilterProperty {
  if (!x) return false;
  return x.value !== undefined;
}

function getSubPropKeys(prop: CategoryFilterProperty): string[] {
  return Object.keys(prop).filter(
    (key) => key !== "name" && key !== "description"
  );
}

///////////////////////////////////////////////////////
////////////// METHODS FOR HTML-ELEMENTS //////////////
///////////////////////////////////////////////////////

function Panel(props: {
  appState: AppState;
  changeHandler: (
    event: any,
    appState: AppState,
    topKey?: string,
    subKey?: string,
    checkboxValue?: string
  ) => void;
  clearPanel: (e: any, appState: AppState) => void;
}) {
  const { clearPanel, ...other } = props;
  return (
    <div className="d-flex justify-content-center">
      <div className="w-75">
        <Accordion>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between">
                <h4 style={{ lineHeight: 1.5, marginBottom: 0 }}>
                  Filter Panel
                </h4>
                <Form className="w-50 d-flex justify-content-between">
                  <div>
                    <Form.Control
                      type="text"
                      name="propertyFilterString"
                      value={props.appState.propertyFilterString}
                      onChange={(e: any) =>
                        props.changeHandler(e, props.appState)
                      }
                      placeholder="Filter for properties..."
                      style={{ width: "300px" }}
                    />
                  </div>
                  <div className="d-flex align-items-center ml-2">
                    {" "}
                    <Form.Check
                      type="checkbox"
                      name="showModifiedOnly"
                      label="Show modified properties only"
                      checked={props.appState.showModifiedOnly}
                      onChange={(e: any) =>
                        props.changeHandler(e, props.appState)
                      }
                    />
                  </div>
                </Form>
                <div className="d-flex justify-content-between">
                  <Button
                    variant="info"
                    onClick={(e: any) => clearPanel(e, props.appState)}
                  >
                    Clear
                  </Button>
                  <Accordion.Toggle
                    as={Button}
                    variant="secondary"
                    eventKey="0"
                    className="ml-2"
                  >
                    Toggle
                  </Accordion.Toggle>
                </div>
              </div>
            </Card.Header>
            <Accordion.Collapse eventKey="0">
              <PropertyTable {...other} />
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    </div>
  );
}

function PropertyTable(props: { appState: AppState; changeHandler: any }) {
  let tableRows: JSX.Element[] = [];

  const filteredPropertySet: FilterPropertySet = FilterService.getFilteredProperties(
    props.appState
  );

  const specialKeys = Object.keys(filteredPropertySet.special);
  for (let key of specialKeys) {
    tableRows.push(<CheckboxRow key={key} propertyKey={key} {...props} />);
  }

  const basicKeys = Object.keys(filteredPropertySet.basic);
  for (let key of basicKeys) {
    const currentProperty: BasicFilterProperty = filteredPropertySet.basic[key];

    if (isScoreFilterProp(currentProperty)) {
      tableRows.push(<ScoreRow key={key} {...props} topKey={key} />);
    } else {
      tableRows.push(
        <CategoryRow
          key={`${key}`}
          title={currentProperty.name}
          description={currentProperty.description}
        />
      );

      const subKeys = getSubPropKeys(currentProperty);

      for (const subKey of subKeys) {
        tableRows.push(<ScoreRow key={`${key}_${subKey}`} {...props} topKey={key} subKey={subKey} />);
      }
    }
  }

  if (tableRows.length === 0) {
    tableRows.push(<NoResultsRow />);
  }

  return (
    <div style={{ maxHeight: "500px", overflow: "auto" }}>
      <form id="filterForm">
        <Table striped bordered hover className="mb-0">
          <tbody>{tableRows}</tbody>
        </Table>
      </form>
    </div>
  );
}

function CheckboxRow(props: {
  appState: AppState;
  changeHandler: (
    event: any,
    appState: AppState,
    topKey?: string,
    subKey?: string,
    checkboxValue?: string
  ) => void;
  propertyKey: string;
}): JSX.Element {
  const property: SpecialFilterProperty =
    props.appState.filterProperties.special[props.propertyKey];

  let checkboxes: JSX.Element[] = [];
  for (const possibleValue of property.possibleValues) {
    checkboxes.push(
      <Checkbox
        key={`${props.propertyKey}_${possibleValue}`}
        propertyKey={props.propertyKey}
        label={possibleValue}
        checked={property.value.includes(possibleValue)}
        changeHandler={(e: any) =>
          props.changeHandler(
            e,
            props.appState,
            undefined,
            undefined,
            possibleValue
          )
        }
      />
    );
  }

  return (
    <tr>
      <td>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <DescriptionElement description={property.description} />
          </span>
          <span className="mr-2">{property.name}</span>
        </div>
      </td>
      <td>{checkboxes}</td>
    </tr>
  );
}

function Checkbox(props: {
  propertyKey: string;
  label: string;
  checked: boolean;
  changeHandler: any;
}) {
  return (
    <label style={{ paddingRight: "2px" }}>
      <input
        type="checkbox"
        name={props.propertyKey}
        checked={props.checked}
        onChange={props.changeHandler}
      />{" "}
      {props.label}
    </label>
  );
}

function CategoryRow(props: { title: string; description: string }) {
  return (
    <tr>
      <td colSpan={2}>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <DescriptionElement description={props.description} />
          </span>
          <span className="mr-2">
            <h4>{props.title}</h4>
          </span>
        </div>
      </td>
    </tr>
  );
}

function ScoreRow(props: {
  appState: AppState;
  changeHandler: (
    event: any,
    appState: AppState,
    topKey?: string,
    subKey?: string,
    checkboxValue?: string
  ) => void;
  topKey: string;
  subKey?: string;
}): JSX.Element {
  const topKey = props.topKey;
  const subKey = props.subKey;
  const filterProperties = props.appState.filterProperties;

  let property: BasicFilterProperty;
  let style: any;
  let changeHandler: any;

  if (subKey) {
    property = (filterProperties.basic[topKey] as CategoryFilterProperty)[
      subKey
    ];
    style = { fontStyle: "italic", fontWeight: 800 };
    changeHandler = (e: any) =>
      props.changeHandler(e, props.appState, topKey, subKey);
  } else {
    property = filterProperties.basic[topKey] as ScoreFilterProperty;
    style = {};
    changeHandler = (e: any) => props.changeHandler(e, props.appState, topKey);
  }

  const selectedValue = property.value;

  let options: JSX.Element[] = [];

  for (let scoreValue of Object.values(ScoreValue)) {
    options.push(<option key={subKey ? `${topKey}_${subKey}_${scoreValue}` : `${topKey}_${scoreValue}`} value={scoreValue}>{scoreValue}</option>);
  }

  return (
    <tr>
      <td>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <DescriptionElement description={property.description} />
          </span>
          <span className="mr-2" style={style}>
            {property.name}
          </span>
        </div>
      </td>
      <td style={{ textAlign: "right" }}>
        <select
          name={subKey ? subKey : topKey}
          value={selectedValue}
          onChange={changeHandler}
        >
          {options}
        </select>
      </td>
    </tr>
  );
}

function NoResultsRow() {
  return (
    <tr>
      <td><span role="img" aria-label="Not amused">😐</span> No properties found...</td>
    </tr>
  );
}

function DescriptionElement(props: { description: string }) {
  if (props.description) {
    return (
      <OverlayTrigger
        placement="top"
        delay={{ show: 100, hide: 200 }}
        overlay={renderTooltip(props.description)}
      >
        <AiFillInfoCircle size={`${1.5}em`} />
      </OverlayTrigger>
    );
  } else {
    return <span></span>;
  }
}

function renderTooltip(description: string) {
  return <Tooltip id={`Tooltip_${description}`}>{description}</Tooltip>;
}
