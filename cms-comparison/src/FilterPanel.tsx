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
} from "./Cms";

export default function FilterPanel(props: any) {
  // TODO: Put Filter-Table-Generation in React.memo, is this smart tho? Table Rows need to rerender!

  const [formProperties, setFormProperties] = React.useState<{
    [x: string]: FormProperty;
  }>(props.cmsData.formProperties);

  const [
    [showModifiedOnly, propertyFilterString],
    setFilterSettings,
  ] = React.useState<[boolean, string]>([false, ""]);

  let emptyFormProperties: {
    [x: string]: FormProperty;
  };
  React.useEffect(() => {
    emptyFormProperties = Object.assign({}, props.cmsData.formProperties);
    console.log(emptyFormProperties);
  }, []);

  const resetPanel = () => {
    setFormProperties(emptyFormProperties);
    console.log(formProperties);
    setFilterSettings([false, ""]);
  };

  const handleChange = (event: any, categoryKey?: string) => {
    console.log("ChangeHandler was called!");
    if (event.target.name === "showModifiedOnly") {
      setFilterSettings([
        event.target.checked ? true : false,
        propertyFilterString,
      ]);
      console.log([showModifiedOnly, propertyFilterString]);
    } else if (event.target.name === "propertyFilterString") {
      setFilterSettings([showModifiedOnly, event.target.value]);
      console.log([showModifiedOnly, propertyFilterString]);
    } else {
      let newFormProperties = Object.assign({}, formProperties); // Clone object, otherwise react won't re-render
      if (categoryKey) {
        (newFormProperties[categoryKey] as CategoryFormProperty)[
          event.target.name
        ].value = event.target.value;
      } else {
        (newFormProperties[event.target.name] as SimpleFormProperty).value =
          event.target.value;
      }
      console.log(
        `Setting key ${event.target.name} (category: ${categoryKey}) to ${event.target.value}`
      );
      setFormProperties(newFormProperties);
      console.log(formProperties);
    }
  };

  const createTableRows = () => {
    let propertyKeys = Object.keys(formProperties);

    // If showModifiedOnly boolean is set, filter!
    if (showModifiedOnly) {
      propertyKeys = propertyKeys.filter((key: string) => {
        const formProperty: FormProperty = formProperties[key];
        if (isSimpleFormProperty(formProperty)) {
          return formProperty.value !== ScoreValue.DONT_CARE;
        }
      });
    }

    // If a filter string exists, filter!
    if (propertyFilterString.length > 0) {
      const filterString: string = propertyFilterString;
      propertyKeys = propertyKeys.filter((key: string) =>
        formProperties[key].name
          .toUpperCase()
          .includes(filterString.toUpperCase())
      );
    }

    let tableRows: JSX.Element[] = [];

    // Add essential rows

    let categoryCheckboxes: JSX.Element[] = [];

    for (const cat in Category) {
      categoryCheckboxes.push(<label><input type="checkbox" name="category" value={cat} />{' '}{cat}{' '}</label>);
    } // TODO: Add onChange, etc. (continue here)

    tableRows.push(
      <tr>
        <td>Category</td>
        <td>{categoryCheckboxes}</td>
      </tr>
    );

    for (const key of propertyKeys) {
      const property: FormProperty =
        formProperties[key];

      if (isCategoryFormProperty(property)) {
        tableRows.push(
          <tr>
            <td colSpan={2}>
              <h4>{property.name}</h4>
            </td>
          </tr>
        );

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

  const createSimpleRow = (key: string, categoryKey?: string): JSX.Element => {
    let property: SimpleFormProperty = {
      name: "",
      description: "",
      value: ScoreValue.DONT_CARE,
    };

    if (categoryKey) {
      const categoryFormProperty = formProperties[categoryKey];
      if (isCategoryFormProperty(categoryFormProperty)) {
        property = categoryFormProperty[key];
      } else {
        throw Error(`Key ${categoryKey} is not a category key!`);
      }
    } else {
      const simpleFormProperty = formProperties[key];
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
    const style = categoryKey
      ? { fontSize: `${0.8}em`, fontStyle: "italic" }
      : {};

    return (
      <tr>
        <td style={style}>{property.name}</td>
        <td>
          <select
            name={key} // Get value from state!
            value={
              categoryKey
                ? (formProperties[categoryKey] as CategoryFormProperty)[key]
                    .value
                : (formProperties[key] as SimpleFormProperty).value
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
