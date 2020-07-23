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
  FormProperty,
  SimpleFormProperty,
  CategoryFormProperty,
  SpecialFormProperty,
  ScoreValue,
  Category,
  License,
  Cms,
  CmsProperty,
  BasicCmsProperty,
  FilterResult,
  FormProperties,
} from "./Cms";

export default function FilterPanel(props: any) {
  const [formProperties, setFormProperties] = React.useState<FormProperties>(
    props.cmsData.formProperties
  );

  const [unchangedFormProperties] = React.useState<FormProperties>(
    deepcopy<FormProperties>(props.cmsData.formProperties)
  );

  const [
    [showModifiedOnly, propertyFilterString],
    setFilterSettings,
  ] = React.useState<[boolean, string]>([false, ""]);

  const resetPanel = () => {
    setFormProperties(
      deepcopy<{
        basic: { [x: string]: FormProperty };
        special: { [x: string]: SpecialFormProperty };
      }>(unchangedFormProperties)
    );
    setFilterSettings([false, ""]);
  };

  React.useEffect(() => {
    console.log("Formproperties changed!");
  }, [formProperties]);

  const handleChange = (event: any, categoryKey?: string, value?: string) => {
    // Clone object, otherwise react won't re-render
    let newFormProperties = Object.assign({}, formProperties);

    if (event.target.name === "showModifiedOnly") {
      setFilterSettings([
        event.target.checked ? true : false,
        propertyFilterString,
      ]);
    } else if (event.target.name === "propertyFilterString") {
      setFilterSettings([showModifiedOnly, event.target.value]);
    } else if (event.target.type === "checkbox" && value) {
      // Special property
      const propertyName = event.target.name;
      console.log(propertyName);
      const valueArray: any[] = (formProperties.special[
        propertyName
      ] as SpecialFormProperty).value;
      if (event.target.checked) {
        // If not already in array, add value to array
        if (!valueArray.includes(value)) {
          valueArray.push(value);
        }
      } else {
        // If in array, remove value from array
        const valueIndex = valueArray.indexOf(value);
        if (valueIndex !== -1) {
          valueArray.splice(valueIndex, 1);
        }
      }
      // Update local copy of formProperties
      (newFormProperties.special[
        propertyName
      ] as SpecialFormProperty).value = valueArray;
    } else {
      // Property inside a category was updated
      // Update local copy of formProperties
      if (categoryKey) {
        (newFormProperties.basic[categoryKey] as CategoryFormProperty)[
          event.target.name
        ].value = event.target.value;
      } else {
        // Simple property was updated
        // Update local copy of formProperties
        (newFormProperties.basic[
          event.target.name
        ] as SimpleFormProperty).value = event.target.value;
      }
    }
    // Update state
    setFormProperties(newFormProperties);
    // Perform filtering TODO: Act on these results e.g. send them up
    filterCms(formProperties, props.cmsData.cms);
  };

  const tableRows = createTableRows(
    formProperties,
    unchangedFormProperties,
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
function filterCms(formProperties: FormProperties, cms: Cms[]): FilterResult[] {
  const start = Date.now();
  const basicKeys = Object.keys(formProperties.basic);
  const specialKeys = Object.keys(formProperties.special);
  let filterResults: FilterResult[] = [];

  for (let i = 0; i < cms.length; i++) {
    const curCms: any = cms[i];

    let has: FormProperties = { basic: {}, special: {} };
    let hasNot: FormProperties = { basic: {}, special: {} };
    let satisfactory: boolean = true;

    specialKeys.forEach((key: string) => {
      const property = formProperties.special[key];
      const values: any[] = property.value;
      if (values.length > 0) {
        if (values.filter((value) => curCms[key].includes(value)).length > 0) {
          has.special[key] = property;
        } else {
          hasNot.special[key] = property;
          satisfactory = false;
        }
      } else {
        hasNot.special[key] = property;
        satisfactory = false;
      }
    });

    basicKeys.forEach((key: string) => {
      const property: FormProperty = formProperties.basic[key];
      if (isSimpleFormProperty(property)) {
        if (property.value != ScoreValue.DONT_CARE) {
          const [hasProperty, isSatisfactory] = cmsHasProperty(
            property,
            curCms.properties[key]
          );
          if (hasProperty) {
            has.basic[key] = property;
          } else {
            hasNot.basic[key] = property;
          }
          if (satisfactory) satisfactory = isSatisfactory;
        }
      } else if (isCategoryFormProperty(property)) {
        const subKeys = Object.keys(property).filter(
          (key: string) => key !== "name" && key !== "description"
        );
        const hasCategoryProperty: CategoryFormProperty = {
          name: property.name,
          description: property.description,
        };
        const hasNotCategoryProperty: CategoryFormProperty = {
          name: property.name,
          description: property.description,
        };

        subKeys.forEach((subKey: string) => {
          const subProperty: SimpleFormProperty = property[subKey];
          if (subProperty.value !== ScoreValue.DONT_CARE) {
            const [hasProperty, isSatisfactory] = cmsHasProperty(
              subProperty,
              curCms.properties[key][subKey]
            );
            if (hasProperty) {
              hasCategoryProperty[key] = subProperty;
            } else {
              hasNotCategoryProperty[key] = subProperty;
            }
            if (satisfactory) satisfactory = isSatisfactory;
          }
        });

        if (categoryFormPropertyIsEmpty(hasCategoryProperty))
          has.basic[key] = hasCategoryProperty;

        if (categoryFormPropertyIsEmpty(hasNotCategoryProperty))
          hasNot.basic[key] = hasNotCategoryProperty;
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
  formProperty: SimpleFormProperty,
  cmsProperty: BasicCmsProperty
): [boolean, boolean] {
  if (cmsProperty && cmsProperty.value) {
    return [true, true];
  } else {
    if (formProperty.value == ScoreValue.REQUIRED) {
      return [false, false];
    }
    return [false, true];
  }
}

function categoryFormPropertyIsEmpty(property: CategoryFormProperty): boolean {
  return (
    Object.keys(property).filter(
      (key: string) => key !== "name" && key !== "description"
    ).length > 0
  );
}

function isCategoryFormProperty(
  x: CategoryFormProperty | SimpleFormProperty
): x is CategoryFormProperty {
  if (!x) return false;
  return x.value === undefined;
}

function isSimpleFormProperty(
  x: CategoryFormProperty | SimpleFormProperty
): x is SimpleFormProperty {
  if (!x) return false;
  return x.value !== undefined;
}

function createTableRows(
  formProperties: FormProperties,
  unchangedFormProperties: FormProperties,
  showModifiedOnly: boolean,
  propertyFilterString: string,
  changeHandler: any
) {
  let tableRows: JSX.Element[] = [];

  const formProps: FormProperties = getFilteredProperties(
    formProperties,
    unchangedFormProperties,
    showModifiedOnly,
    propertyFilterString
  );

  // Add special rows
  const specialKeys = Object.keys(formProps.special);

  for (let key of specialKeys) {
    tableRows.push(
      createCheckboxRow(
        key,
        formProperties,
        formProperties.special[key] as SpecialFormProperty,
        changeHandler
      )
    );
  }

  const basicKeys = Object.keys(formProps.basic);

  for (let key of basicKeys) {
    const property: FormProperty = formProps.basic[key];

    if (isSimpleFormProperty(property)) {
      tableRows.push(createSimpleRow(formProps, key, changeHandler));
    } else {
      tableRows.push(
        <CategoryRow
          title={formProps.basic[key].name}
          description={formProps.basic[key].description}
        />
      );

      const subKeys = getSubPropKeys(property);

      for (const subKey of subKeys) {
        tableRows.push(createSimpleRow(formProps, subKey, changeHandler, key));
      }
    }
  }

  if (tableRows.length === 0) {
    tableRows.push(<NoResultsRow />);
  }
  return tableRows;
}

// It is assumed that checkbox rows are not sub-categories
function createCheckboxRow(
  key: string,
  formProperties: FormProperties,
  property: SpecialFormProperty,
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
        checked={(formProperties.special[
          key
        ] as SpecialFormProperty).value.includes(value)}
        changeHandler={(e: any) => changeHandler(e, undefined, value)}
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
  formProperties: FormProperties,
  basicKey: string,
  changeHandler: (
    event: any,
    categoryKey?: string | undefined,
    value?: string | undefined
  ) => void,
  categoryKey?: string
): JSX.Element {
  let property: SimpleFormProperty;

  try {
    if (categoryKey) {
      property = (formProperties.basic[categoryKey] as CategoryFormProperty)[
        basicKey
      ];
    } else {
      property = formProperties.basic[basicKey] as SimpleFormProperty;
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
    ? (formProperties.basic[categoryKey] as CategoryFormProperty)[basicKey]
        .value
    : (formProperties.basic[basicKey] as SimpleFormProperty).value;

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
  formProperties: FormProperties,
  unchangedFormProperties: FormProperties,
  showModifiedOnly: boolean,
  propertyFilterString: string
): FormProperties {
  let result: FormProperties = { basic: {}, special: {} };

  if (!showModifiedOnly && propertyFilterString.length === 0) {
    return formProperties;
  }

  if (showModifiedOnly) {
    let specialKeys = Object.keys(formProperties.special);

    specialKeys = specialKeys.filter((key: string) => {
      const property = formProperties.special[key];
      const refProperty = unchangedFormProperties.special[key];
      return !arraysAreEqual(property.value, refProperty.value);
    });

    specialKeys.forEach(
      (key: string) => (result.special[key] = formProperties.special[key])
    );

    const basicKeys = Object.keys(formProperties.basic);

    for (const key of basicKeys) {
      const property = formProperties.basic[key];
      if (isSimpleFormProperty(property)) {
        const refProperty = unchangedFormProperties.basic[key];
        if (property.value !== (refProperty as SimpleFormProperty).value) {
          result.basic[key] = property;
        }
      } else if (isCategoryFormProperty(property)) {
        let newCatProp: CategoryFormProperty = {
          name: formProperties.basic[key].name,
          description: formProperties.basic[key].description,
        };

        const subKeys = getSubPropKeys(property);

        for (const subKey of subKeys) {
          const subProperty = (formProperties.basic[
            key
          ] as CategoryFormProperty)[subKey];
          const refProperty = (unchangedFormProperties.basic[
            key
          ] as CategoryFormProperty)[subKey];
          if (subProperty.value !== (refProperty as SimpleFormProperty).value) {
            newCatProp[subKey] = subProperty;
          }
        }
        if (getSubPropKeys(newCatProp).length > 0) {
          result.basic[key] = newCatProp;
        }
      }
    }
  }

  let currentFormProperties: any;
  if (showModifiedOnly) {
    currentFormProperties = result;
  } else {
    currentFormProperties = formProperties;
  }

  if (propertyFilterString.length > 0) {
    const specialKeys = Object.keys(currentFormProperties.special);
    specialKeys.forEach((key: string) => {
      const property: SpecialFormProperty = currentFormProperties.special[key];
      if (
        !property.name
          .toUpperCase()
          .includes(propertyFilterString.toUpperCase())
      ) {
        if (showModifiedOnly) {
          delete result.special[key];
        }
      } else {
        result.special[key] = property;
      }
    });

    const basicKeys = Object.keys(currentFormProperties.basic);
    basicKeys.forEach((key: string) => {
      const property: FormProperty = currentFormProperties.basic[key];
      if (isSimpleFormProperty(property)) {
        if (
          !property.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {
          if (showModifiedOnly) {
            // TODO: Unclear to everyone but me what is happening here, fix!
            delete result.basic[key];
          }
        } else {
          result.basic[key] = property;
        }
      } else {
        if (
          property.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {
          // If category itself matches the search string...
          result.basic[key] = property;
        } else {
          let newCatProp: CategoryFormProperty = {
            name: property.name,
            description: property.description,
          };
          const subKeys = getSubPropKeys(property);
          subKeys.forEach((subKey: string) => {
            const subProperty: SimpleFormProperty = (property as CategoryFormProperty)[
              subKey
            ];
            if (
              !subProperty.name
                .toUpperCase()
                .includes(propertyFilterString.toUpperCase())
            ) {
              if (showModifiedOnly) {
                // TODO: Unclear to everyone but me what is happening here, fix!
                delete (result.basic[key] as CategoryFormProperty)[subKey];
              }
            } else {
              newCatProp[subKey] = subProperty;
            }
          });

          if (getSubPropKeys(newCatProp).length > 0) {
            result.basic[key] = newCatProp;
          }
        }
      }
    });
  }
  return result;
}

function getSubPropKeys(property: FormProperty): string[] {
  return Object.keys(property).filter(
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
