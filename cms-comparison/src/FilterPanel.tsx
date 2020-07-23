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
  FilterResult,
} from "./Cms";

import FilterService from "./FilterService";

export default function FilterPanel(props: {
  cmsData: any;
  setFilterResults: (filterResults: FilterResult[]) => void;
}) {
  const [filter, setFilter] = React.useState<FilterPropertySet>(
    props.cmsData.filterProperties
  );

  const [initialFilter] = React.useState<FilterPropertySet>(
    deepcopy<FilterPropertySet>(props.cmsData.filterProperties)
  );

  // When initialized, set filter results of cardList
  React.useEffect(() => {
    updateCardList(filter);
  }, []);

  const [
    [showModifiedOnly, propertyFilterString],
    setFilterSettings,
  ] = React.useState<[boolean, string]>([false, ""]);

  const resetPanel = () => {
    setFilter(deepcopy<FilterPropertySet>(initialFilter));
    setFilterSettings([false, ""]);
    updateCardList(initialFilter);
  };

  const updateCardList = (filter: FilterPropertySet) => {
    props.setFilterResults(FilterService.filterCms(filter, props.cmsData.cms));
  }

  const handleChange = (event: any, categoryKey?: string, value?: string) => {
    // Clone object, otherwise react won't re-render
    let newFilter = Object.assign({}, filter);

    if (event.target.name === "showModifiedOnly") {
      setFilterSettings([
        event.target.checked ? true : false,
        propertyFilterString,
      ]);
    } else if (event.target.name === "propertyFilterString") {
      setFilterSettings([showModifiedOnly, event.target.value]);
    } else if (event.target.type === "checkbox" && value) {
      // Special property
      const propName = event.target.name;
      console.log(propName);
      const valArray: any[] = filter.special[propName].value;
      if (event.target.checked) {
        // If not already in array, add value to array
        if (!valArray.includes(value)) {
          valArray.push(value);
        }
      } else {
        // If in array, remove value from array
        const valueIndex = valArray.indexOf(value);
        if (valueIndex !== -1) {
          valArray.splice(valueIndex, 1);
        }
      }
      // Update local copy of formProperties
      newFilter.special[propName].value = valArray;
    } else {
      // Property inside a category was updated
      // Update local copy of formProperties
      if (categoryKey) {
        (newFilter.basic[categoryKey] as CategoryFilterProperty)[
          event.target.name
        ].value = event.target.value;
      } else {
        // Score property was updated
        // Update local copy of formProperties
        (newFilter.basic[event.target.name] as ScoreFilterProperty).value =
          event.target.value;
      }
    }
    // Update state
    setFilter(newFilter);
    updateCardList(newFilter);
  };

  const tableRows = createTableRows(
    filter,
    initialFilter,
    showModifiedOnly,
    propertyFilterString,
    handleChange
  );

  return (
    <Panel
      tableRows={tableRows}
      propertyFilterString={propertyFilterString}
      showModifiedOnly={showModifiedOnly}
      resetPanel={resetPanel}
      changeHandler={handleChange}
    />
  );
}

function isScoreFilterProp(x: BasicFilterProperty): x is ScoreFilterProperty {
  if (!x) return false;
  return x.value !== undefined;
}

function createTableRows(
  propSet: FilterPropertySet,
  initialPropSet: FilterPropertySet,
  showModifiedOnly: boolean,
  propertyFilterString: string,
  changeHandler: any
) {
  let tableRows: JSX.Element[] = [];

  const filteredPropSet: FilterPropertySet = FilterService.getFilteredProperties(
    propSet,
    initialPropSet,
    showModifiedOnly,
    propertyFilterString
  );

  // Add special rows
  const specialKeys = Object.keys(filteredPropSet.special);

  for (let key of specialKeys) {
    tableRows.push(
      createCheckboxRow(key, propSet, propSet.special[key], changeHandler)
    );
  }

  const basicKeys = Object.keys(filteredPropSet.basic);

  for (let key of basicKeys) {
    const curProp: BasicFilterProperty = filteredPropSet.basic[key];

    if (isScoreFilterProp(curProp)) {
      tableRows.push(createSimpleRow(filteredPropSet, key, changeHandler));
    } else {
      tableRows.push(
        <CategoryRow title={curProp.name} description={curProp.description} />
      );

      const subKeys = getSubPropKeys(curProp);

      for (const subKey of subKeys) {
        tableRows.push(
          createSimpleRow(filteredPropSet, subKey, changeHandler, key)
        );
      }
    }
  }

  if (tableRows.length === 0) {
    tableRows.push(<NoResultsRow />);
  }
  return tableRows;
}

function createCheckboxRow(
  key: string,
  propSet: FilterPropertySet,
  property: SpecialFilterProperty,
  changeHandler: (
    event: any,
    categoryKey?: string | undefined,
    value?: string | undefined
  ) => void
): JSX.Element {
  let checkboxes: JSX.Element[] = [];
  for (const value of property.possibleValues) {
    checkboxes.push(
      <Checkbox
        propertyKey={key}
        label={value}
        checked={propSet.special[key].value.includes(value)}
        changeHandler={(e: any) => changeHandler(e, undefined, value)} // TODO: Check this
      />
    );
  }

  return (
    <CheckboxRow
      title={property.name}
      description={property.description}
      checkboxes={checkboxes}
    />
  );
}

function createSimpleRow(
  propSet: FilterPropertySet,
  basicKey: string,
  changeHandler: (
    event: any,
    categoryKey?: string | undefined,
    value?: string | undefined
  ) => void,
  categoryKey?: string
): JSX.Element {
  let property: ScoreFilterProperty;

  try {
    if (categoryKey) {
      property = (propSet.basic[categoryKey] as CategoryFilterProperty)[
        basicKey
      ];
    } else {
      property = propSet.basic[basicKey] as ScoreFilterProperty;
    }
  } catch (e) {
    throw new Error(
      `The property ${basicKey} ${
        categoryKey ? "with category " + categoryKey : ""
      } does not exist!`
    );
  }

  let options: JSX.Element[] = [];

  for (let scoreValue of Object.values(ScoreValue)) {
    options.push(<option value={scoreValue}>{scoreValue}</option>);
  }

  // Set style accordingly if it is a subRow
  const style = categoryKey ? { fontStyle: "italic", fontWeight: 800 } : {};

  const rowValue = categoryKey
    ? (propSet.basic[categoryKey] as CategoryFilterProperty)[basicKey].value
    : (propSet.basic[basicKey] as ScoreFilterProperty).value;

  const handler = categoryKey
    ? (e: any) => changeHandler(e, categoryKey)
    : (e: any) => changeHandler(e);

  return (
    <SimpleRow
      title={property.name}
      value={rowValue}
      description={property.description}
      propertyKey={basicKey}
      changeHandler={handler}
      style={style}
      options={options}
    />
  );
}

function getSubPropKeys(prop: CategoryFilterProperty): string[] {
  return Object.keys(prop).filter(
    (key) => key !== "name" && key !== "description"
  );
}

///////////////////////////////////////////////////////
////////////// METHODS FOR HTML-ELEMENTS //////////////
///////////////////////////////////////////////////////

function SimpleRow(props: {
  propertyKey: string;
  title: string;
  description: string;
  style: any;
  value: string;
  options: JSX.Element[];
  changeHandler: any;
}) {
  return (
    <tr>
      <td>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <DescriptionElement description={props.description} />
          </span>
          <span className="mr-2" style={props.style}>
            {props.title}
          </span>
        </div>
      </td>
      <td style={{ textAlign: "right" }}>
        <select
          name={props.propertyKey}
          value={props.value} // Get value from state!
          onChange={props.changeHandler}
        >
          {props.options}
        </select>
      </td>
    </tr>
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

function CheckboxRow(props: {
  title: string;
  description: string;
  checkboxes: JSX.Element[];
}) {
  return (
    <tr>
      <td>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <DescriptionElement description={props.description} />
          </span>
          <span className="mr-2">{props.title}</span>
        </div>
      </td>
      <td>{props.checkboxes}</td>
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

function NoResultsRow() {
  return (
    <tr>
      <td>😐 No properties found...</td>
    </tr>
  );
}

function Panel(props: {
  propertyFilterString: string;
  showModifiedOnly: boolean;
  tableRows: JSX.Element[];
  resetPanel: () => void;
  changeHandler: any;
}) {
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
                      value={props.propertyFilterString}
                      onChange={props.changeHandler}
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
                      checked={props.showModifiedOnly}
                      onChange={props.changeHandler}
                    />
                  </div>
                </Form>
                <div className="d-flex justify-content-between">
                  <Button variant="info" onClick={props.resetPanel}>
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
              <div style={{ maxHeight: "500px", overflow: "auto" }}>
                <form id="filterForm">
                  <Table striped bordered hover className="mb-0">
                    <tbody>{props.tableRows}</tbody>
                  </Table>
                </form>
              </div>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    </div>
  );
}
