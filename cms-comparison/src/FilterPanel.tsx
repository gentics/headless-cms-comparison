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
  Cms,
  BooleanCmsProperty,
  FilterResult,
  FilterPropertySet,
  BasicFilterProperty,
  CategoryFilterProperty,
  ScoreFilterProperty,
  SpecialFilterProperty,
} from "./Cms";

export default function FilterPanel(props: any) {
  const [filter, setFilter] = React.useState<FilterPropertySet>(
    props.cmsData.filterProperties
  );

  const [initialFilter] = React.useState<FilterPropertySet>(
    deepcopy<FilterPropertySet>(props.cmsData.filterProperties)
  );

  const [
    [showModifiedOnly, propertyFilterString],
    setFilterSettings,
  ] = React.useState<[boolean, string]>([false, ""]);

  const resetPanel = () => {
    setFilter(deepcopy<FilterPropertySet>(initialFilter));
    setFilterSettings([false, ""]);
  };

  React.useEffect(() => {
    console.log("Formproperties changed!");
  }, [filter]);

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
      const valArray: any[] = filter.special[
        propName
      ].value;
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
      newFilter.special[
        propName
      ].value = valArray;
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
        (newFilter.basic[
          event.target.name
        ] as ScoreFilterProperty).value = event.target.value;
      }
    }
    // Update state
    setFilter(newFilter);
    // Perform filtering TODO: Act on these results e.g. send them up
    filterCms(filter, props.cmsData.cms);
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

/**
 * Filters the cms acoording to @param formProperties.
 * Returns all cms, satisfactory boolean is set accordingly.
 */
function filterCms(
  filterPropSet: FilterPropertySet,
  cms: Cms[]
): FilterResult[] {
  let filterResults: FilterResult[] = [];
  
  const basicPropKeys = Object.keys(filterPropSet.basic);
  const specialPropKeys = Object.keys(filterPropSet.special);

  for (let i = 0; i < cms.length; i++) {
    const curCms: any = cms[i];

    let has: FilterPropertySet = { basic: {}, special: {} };
    let hasNot: FilterPropertySet = { basic: {}, special: {} };
    let satisfactory: boolean = true;

    specialPropKeys.forEach((key: string) => {
      const curProp = filterPropSet.special[key];
      const reqValues: any[] = curProp.value;
      if (reqValues.length > 0) {
        if (
          getArrayIntersection(reqValues, curCms[key]).length > 0
        ) {
          has.special[key] = curProp;
        } else {
          hasNot.special[key] = curProp;
          satisfactory = false;
        }
      } else {
        hasNot.special[key] = curProp;
        satisfactory = false;
      }
    });

    basicPropKeys.forEach((key: string) => {
      const curProp = filterPropSet.basic[key];
      if (isScoreFilterProp(curProp)) {
        if (curProp.value != ScoreValue.DONT_CARE) {
          const [hasProperty, isSatisfactory] = cmsHasProperty(
            curProp,
            curCms.properties[key]
          );
          hasProperty
            ? (has.basic[key] = curProp)
            : (hasNot.basic[key] = curProp);

          if (satisfactory) satisfactory = isSatisfactory;
        }
      } else {
        const curSubPropKeys = getSubPropKeys(curProp);
        const hasCategoryProp: CategoryFilterProperty = {
          name: curProp.name,
          description: curProp.description,
        };
        const hasNotCategoryProp: CategoryFilterProperty = {
          name: curProp.name,
          description: curProp.description,
        };

        curSubPropKeys.forEach((subKey: string) => {
          const subProp: ScoreFilterProperty = curProp[subKey];
          if (subProp.value != ScoreValue.DONT_CARE) {
            const [hasProperty, isSatisfactory] = cmsHasProperty(
              subProp,
              curCms.properties[key][subKey]
            );
            hasProperty 
              ? (hasCategoryProp[key] = subProp)
              : (hasNotCategoryProp[key] = subProp);
            
            if (satisfactory) satisfactory = isSatisfactory;
          }
        });

        if (getSubPropKeys(hasCategoryProp).length > 0)
          has.basic[key] = hasCategoryProp;

        if (getSubPropKeys(hasNotCategoryProp).length > 0)
          hasNot.basic[key] = hasNotCategoryProp;
      }
    });

    filterResults.push({
      cms: curCms,
      has: has,
      hasNot: hasNot,
      satisfactory: satisfactory,
    });
  }

  console.table(filterResults);
  return filterResults;
}

/**
 * Checks if a CMS has a certain property.
 * If the property is not available, it is additionally
 * checked wether this property was tagged as REQUIRED,
 * if so the satisfactory boolean is set to false.
 * @returns [hasProperty, isSatisfactory]
 */
function cmsHasProperty(
  scoreFilterProp: ScoreFilterProperty,
  cmsProperty: BooleanCmsProperty
): [boolean, boolean] {
  if (cmsProperty && cmsProperty.value) {
    return [true, true];
  } else {
    if (scoreFilterProp.value == ScoreValue.REQUIRED) {
      return [false, false];
    }
    return [false, true];
  }
}

function getArrayIntersection(a: string[], b: string[]): string[] {
  return a.filter((value) => b.includes(value));
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

  const filteredPropSet: FilterPropertySet = getFilteredProperties(
    propSet,
    initialPropSet,
    showModifiedOnly,
    propertyFilterString
  );

  // Add special rows
  const specialKeys = Object.keys(filteredPropSet.special);

  for (let key of specialKeys) {
    tableRows.push(
      createCheckboxRow(
        key,
        propSet,
        propSet.special[key],
        changeHandler
      )
    );
  }

  const basicKeys = Object.keys(filteredPropSet.basic);

  for (let key of basicKeys) {
    const curProp: BasicFilterProperty = filteredPropSet.basic[key];

    if (isScoreFilterProp(curProp)) {
      tableRows.push(createSimpleRow(filteredPropSet, key, changeHandler));
    } else {
      tableRows.push(
        <CategoryRow
          title={curProp.name}
          description={curProp.description}
        />
      );

      const subKeys = getSubPropKeys(curProp);

      for (const subKey of subKeys) {
        tableRows.push(createSimpleRow(filteredPropSet, subKey, changeHandler, key));
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
        checked={propSet.special[
          key
        ].value.includes(value)}
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
    ? (propSet.basic[categoryKey] as CategoryFilterProperty)[basicKey]
        .value
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

function getFilteredProperties(
  propSet: FilterPropertySet,
  initialPropSet: FilterPropertySet,
  showModifiedOnly: boolean,
  propertyFilterString: string
): FilterPropertySet {
  if (!showModifiedOnly && propertyFilterString.length === 0) {
    // No filtering required, return whole propSet
    return propSet;
  }

  let workPropSet: FilterPropertySet = deepcopy(propSet);

  if (showModifiedOnly) {
    let specialPropKeys = Object.keys(workPropSet.special);

    // Delete all non-modified keys
    specialPropKeys.forEach((key: string) => {
      const curProp = propSet.special[key];
      const refProp = initialPropSet.special[key];
      if (arraysAreEqual(curProp.value, refProp.value)) {
        delete workPropSet.special[key]
      }
    });

    const basicPropKeys = Object.keys(propSet.basic);

    for (const key of basicPropKeys) {
      const curProp = propSet.basic[key];
      if (isScoreFilterProp(curProp)) {
        const refProp = initialPropSet.basic[key] as ScoreFilterProperty;
        if (curProp.value === refProp.value) {
          delete workPropSet.basic[key];
        }
      } else {
        const curSubPropKeys = getSubPropKeys(curProp);

        for (const subKey of curSubPropKeys) {
          const subProp = (propSet.basic[
            key
          ] as CategoryFilterProperty)[subKey];

          const refProp = (initialPropSet.basic[
            key
          ] as CategoryFilterProperty)[subKey];

          if (subProp.value === refProp.value) {
            delete (workPropSet.basic[key] as CategoryFilterProperty)[subKey];
          }
        }
        if (getSubPropKeys(workPropSet.basic[key]).length > 0) {
          delete workPropSet.basic[key];
        }
      }
    }
  }

  if (propertyFilterString.length > 0) {
    const specialPropKeys = Object.keys(workPropSet.special);
    
    specialPropKeys.forEach((key: string) => {
      const property = workPropSet.special[key];
      if (
        !property.name
          .toUpperCase()
          .includes(propertyFilterString.toUpperCase())
      ) { 
        delete workPropSet.special[key];
      }
    });

    const basicPropKeys = Object.keys(workPropSet.basic);
    basicPropKeys.forEach((key: string) => {
      const prop = workPropSet.basic[key];
      if (isScoreFilterProp(prop)) {
        if (
          !prop.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {  
          delete workPropSet.basic[key];
        }
      } else {
        if (
          !prop.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {
          // If category itself does not match the search string, filter the subProps
          workPropSet.basic[key] = prop;
          const subPropKeys = getSubPropKeys(prop);
          subPropKeys.forEach((subKey) => {
            const subProp = (prop as CategoryFilterProperty)[subKey];
            if (
              !subProp.name
                .toUpperCase()
                .includes(propertyFilterString.toUpperCase())
            ) {
              delete (workPropSet.basic[key] as CategoryFilterProperty)[subKey];
            }
          });
          if (getSubPropKeys(workPropSet.basic[key]).length === 0) {
            delete workPropSet.basic[key];
          }
        }
      }
    });
  }
  return workPropSet;
}

function getSubPropKeys(prop: CategoryFilterProperty): string[] {
  return Object.keys(prop).filter(
    (key) => key !== "name" && key !== "description"
  );
}

function arraysAreEqual(a: any[], b: any[]): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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
