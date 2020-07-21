import * as React from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {
  Cms,
  FormProperty,
  SimpleFormProperty,
  Property,
  ScoreValue,
  CategoryFormProperty,
  Category,
  SpecialFormProperty,
  License,
} from "./Cms";

export default function FilterPanel(props: any) {
  // TODO: Put Filter-Table-Generation in React.memo, is this smart tho? Table Rows need to rerender!

  const [formProperties, setFormProperties] = React.useState<{
    basic: { [x: string]: FormProperty };
    special: { [x: string]: SpecialFormProperty };
  }>(props.cmsData.formProperties);

  const [unchangedFormProperties] = React.useState<{
    basic: { [x: string]: FormProperty };
    special: { [x: string]: SpecialFormProperty };
  }>(JSON.parse(JSON.stringify(props.cmsData.formProperties))); // TODO: This is a hack

  const [
    [showModifiedOnly, propertyFilterString],
    setFilterSettings,
  ] = React.useState<[boolean, string]>([false, ""]);

  const resetPanel = () => {
    setFormProperties(unchangedFormProperties);
    setFilterSettings([false, ""]);
  };

  const handleChange = (event: any, categoryKey?: string, value?: string) => {
    console.log("ChangeHandler was called!");
    // Clone object, otherwise react won't re-render
    let newFormProperties = Object.assign({}, formProperties);
    if (event.target.name === "showModifiedOnly") {
      setFilterSettings([
        event.target.checked ? true : false,
        propertyFilterString,
      ]);
      // console.log([showModifiedOnly, propertyFilterString]);
    } else if (event.target.name === "propertyFilterString") {
      setFilterSettings([showModifiedOnly, event.target.value]);
      // console.log([showModifiedOnly, propertyFilterString]);
    } else if (event.target.type === "checkbox" && value) {
      const propertyName = event.target.name;
      const valueArray: any[] = (formProperties.special[
        propertyName
      ] as SpecialFormProperty).value;
      if (event.target.checked) {
        // It is assumed that there are no checkboxes in categories
        if (!valueArray.includes(value)) {
          valueArray.push(value);
        }
      } else {
        const valueIndex = valueArray.indexOf(value);
        if (valueIndex !== -1) {
          valueArray.splice(valueIndex, 1);
        }
      }
      (newFormProperties.special[
        propertyName
      ] as SpecialFormProperty).value = valueArray;
      setFormProperties(newFormProperties);
      console.log(formProperties);
    } else {
      if (categoryKey) {
        (newFormProperties.basic[categoryKey] as CategoryFormProperty)[
          event.target.name
        ].value = event.target.value;
      } else {
        (newFormProperties.basic[
          event.target.name
        ] as SimpleFormProperty).value = event.target.value;
      }
      setFormProperties(newFormProperties);
      console.log(formProperties);
    }
  };

  const arraysEqual = (a: any[], b: any[]): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const getFilteredProperties = (): {
    basic: { [x: string]: FormProperty };
    special: { [x: string]: SpecialFormProperty };
  } => {
    let result: {
      basic: { [x: string]: FormProperty };
      special: { [x: string]: SpecialFormProperty };
    } = { basic: {}, special: {} };

    if (!showModifiedOnly && propertyFilterString.length === 0) {
      return formProperties;
    }

    if (showModifiedOnly) {
      let specialKeys = Object.keys(formProperties.special);

      specialKeys = specialKeys.filter((key: string) => {
        const property = formProperties.special[key];
        const refProperty = unchangedFormProperties.special[key];
        return !arraysEqual(property.value, refProperty.value);
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
          const resProp: {
            name: string;
            description: string;
            [x: string]: string;
          } = {
            name: formProperties.basic[key].name,
            description: formProperties.basic[key].description,
          };
          const subKeys = Object.keys(property).filter(
            (key) => key !== "name" && key !== "description"
          );
          for (const subKey of subKeys) {
            const subProperty = (formProperties.basic[
              key
            ] as CategoryFormProperty)[subKey];
            const refProperty = (unchangedFormProperties.basic[
              key
            ] as CategoryFormProperty)[subKey];
            if (
              subProperty.value !== (refProperty as SimpleFormProperty).value
            ) {
              resProp[subKey] = subProperty;
            }
          }
          if (
            Object.keys(resProp).filter(
              (key) => key !== "name" && key !== "description"
            ).length > 0
          ) {
            result.basic[key] = resProp;
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
        const property: SpecialFormProperty =
          currentFormProperties.special[key];
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
        if (
          !property.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {
          if (showModifiedOnly) {
            delete result.basic[key];
          }
        } else {
          result.basic[key] = property;
        }
      });
    }
    return result;
  };

  const createTableRows = () => {
    let tableRows: JSX.Element[] = [];

    const formProps = getFilteredProperties();

    // Add essential rows
    const specialKeys = Object.keys(formProps.special);

    for (let key of specialKeys) {
      tableRows.push(
        createCheckboxRow(
          key,
          formProperties.special[key] as SpecialFormProperty
        )
      );
    }

    const basicKeys = Object.keys(formProps.basic);

    for (let key of basicKeys) {
      const property: FormProperty = formProps.basic[key];

      if (isCategoryFormProperty(property)) {
        tableRows.push(createCategoryRow(property));

        const subKeys = Object.keys(property).filter(
          (key) => key !== "name" && key !== "description"
        );

        for (const subKey of subKeys) {
          tableRows.push(createSimpleRow(subKey, key));
        }
      } else {
        tableRows.push(createSimpleRow(key));
      }
    }

    if (tableRows.length === 0) {
      tableRows.push(
        <tr>
          <td>😐 No properties found...</td>
        </tr>
      );
    }
    return tableRows;
  };

  // It is assumed that checkbox rows are not sub-categories
  const createCheckboxRow = (key: string, property: SpecialFormProperty) => {
    let checkboxes: JSX.Element[] = [];
    for (const value of property.possibleValues) {
      checkboxes.push(
        <label style={{ paddingRight: "2px" }}>
          <input
            type="checkbox"
            name={key}
            checked={(formProperties.special[
              key
            ] as SpecialFormProperty).value.includes(value)}
            onChange={(e) => handleChange(e, undefined, value)}
          />{" "}
          {value}
        </label>
      );
    }

    return (
      <tr>
        <td>{property.name}</td>
        <td>{checkboxes}</td>
      </tr>
    );
  };

  const createCategoryRow = (property: FormProperty): JSX.Element => {
    return (
      <tr>
        <td colSpan={2}>
          <h4>{property.name}</h4>
        </td>
      </tr>
    );
  };

  const createSimpleRow = (key: string, categoryKey?: string): JSX.Element => {
    let property: SimpleFormProperty = {
      name: "",
      description: "",
      value: ScoreValue.DONT_CARE,
    };

    if (categoryKey) {
      const categoryFormProperty = formProperties.basic[categoryKey];
      if (isCategoryFormProperty(categoryFormProperty)) {
        property = categoryFormProperty[key];
      } else {
        throw Error(`Key ${categoryKey} is not a category key!`);
      }
    } else {
      const simpleFormProperty = formProperties.basic[key];
      if (isSimpleFormProperty(simpleFormProperty)) {
        property = simpleFormProperty;
      }
    }

    if (!property.name)
      throw Error(`Cannot get property information for key ${key}!`);

    let options: JSX.Element[] = [];
    for (let scoreValue in ScoreValue) {
      if (!isNaN(Number(scoreValue))) {
        const optionString =
          scoreValue === ScoreValue.DONT_CARE.toString()
            ? "Don't Care"
            : scoreValue === ScoreValue.NICE_TO_HAVE.toString()
            ? "Nice-To-Have"
            : "Required";
        options.push(
          <option value={parseInt(scoreValue, 10)}>{optionString}</option>
        ); // TODO: Pasting strings in state, need numbers
      }
    }

    // Set style accordingly if it is a subRow
    const style = categoryKey ? { fontStyle: "italic", fontWeight: 800 } : {};

    return (
      <tr>
        <td style={style}>{property.name}</td>
        <td style={{ textAlign: "right" }}>
          <select
            name={key} // Get value from state!
            value={
              categoryKey
                ? (formProperties.basic[categoryKey] as CategoryFormProperty)[
                    key
                  ].value
                : (formProperties.basic[key] as SimpleFormProperty).value
            }
            onChange={(e) => handleChange(e, categoryKey ? categoryKey : "")}
          >
            {options}
          </select>
        </td>
      </tr>
    );
  };

  const isCategoryFormProperty = (
    x: CategoryFormProperty | SimpleFormProperty
  ): x is CategoryFormProperty => {
    if (!x) return false;
    return x.value === undefined;
  };

  const isSimpleFormProperty = (
    x: CategoryFormProperty | SimpleFormProperty
  ): x is SimpleFormProperty => {
    if (!x) return false;
    return x.value !== undefined;
  };

  let tableRows = createTableRows();

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
                      value={propertyFilterString}
                      onChange={handleChange}
                      placeholder="Filter for properties..."
                      style={{ width: "300px" }}
                    />
                  </div>
                  <div className="d-flex align-items-center ml-2">
                    {" "}
                    {/* TODO: Looks bad on mobile */}
                    <Form.Check
                      type="checkbox"
                      name="showModifiedOnly"
                      label="Show modified properties only"
                      checked={showModifiedOnly}
                      onChange={handleChange}
                    />
                  </div>
                </Form>
                <div className="d-flex justify-content-between">
                  <Button variant="info" onClick={resetPanel}>
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
                    <tbody>{tableRows}</tbody>
                  </Table>
                </form>
              </div>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    </div>
    /*<div className="d-flex justify-content-end my-2 mx-2">
        <Button variant="secondary" className="mr-1" disabled>Maybe Filter-Export possibility?</Button>
        <Button variant="danger" className="mr-1" disabled>Reset filter</Button>
        <input className="btn btn-success" type="submit" value="Apply filter" />
      </div>*/
  );
}
