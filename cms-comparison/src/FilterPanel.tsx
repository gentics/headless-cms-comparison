import * as React from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useFormik } from 'formik';

export default function FilterPanel(props: any) {
  const filterForm = React.useRef<any>();
  const fieldFilterForm = React.useRef<any>();
  const resetPanelButton = React.useRef<any>();


  // TODO: Put Filter-Table-Generation in React.memo

  

  const cmsData = props.cmsData;
  


  const [
    [fieldFilterString, showOnlyModified],
    setFieldFilter,
  ] = React.useState<any>(["", false]);

  React.useEffect(() => {}, [fieldFilterString, showOnlyModified]);

  React.useEffect(() => {
    filterForm.current.addEventListener("change", (e: any) => {
      const json = parseFilterData(getFormValues(filterForm.current));
      console.log(json);
      props.setFilter(json);
    });

    fieldFilterForm.current.addEventListener("input", (e: any) => {
      const form = fieldFilterForm.current.querySelectorAll("input");
      setFieldFilter([form[0].value, form[1].checked]);
    });

    resetPanelButton.current.addEventListener("click", (e: any) => {
      fieldFilterForm.current.reset();
      setFieldFilter(["", false]);
      filterForm.current.reset();
      props.updateFilter(null);
    });
  }, []); // On mount, add eventListeners to forms*/

  let fieldValues: any[] = []; // constructFieldValues(props.cmsData);

  const filterData = props.getFilter(); // Get filter from parent

  if (showOnlyModified) {
    // Add all fields of the current filter to the array
    const modifiedFieldNames: string[] = [filterData.niceToHave];
    filterData.required.forEach(([name, _]: [string, any]) => {
      modifiedFieldNames.push(name);
    });
    // Filter the field-set by searching for the fieldName in the modifiedFieldNames-Array
    fieldValues = fieldValues.filter((field: any) =>
      modifiedFieldNames.some((fieldName: string) => fieldName === field.name)
    );
  }

  if (fieldFilterString.length > 0) {
    fieldValues = fieldValues.filter((field: any) =>
      field.name.toUpperCase().includes(fieldFilterString.toUpperCase())
    );
  }

  let tableRows: any;
  if (fieldValues.length > 0) {
    tableRows = fieldValues.map((field: any) => {
      // TODO: Add for
      const curFieldValues: [string] = getFieldValue(field, filterData);
      let options = [];
      if (field.values.includes("Yes") && field.values.includes("No")) {
        options.push(
          <option
            key={field.name.concat("_" + 0)}
            value=""
            defaultChecked={curFieldValues.includes("")}
          >
            don't care
          </option>
        );
        options.push(
          <option
            key={field.name.concat("_" + 1)}
            value="Nice-To-Have"
            defaultChecked={curFieldValues.includes("Nice-To-Have")}
          >
            nice-to-have
          </option>
        );
        options.push(
          <option
            key={field.name.concat("_" + 2)}
            value="Yes"
            defaultChecked={curFieldValues.includes("Yes")}
          >
            required
          </option>
        );
        options = [<select name={field.name}>{options}</select>];
      } else {
        options = field.values.sort().map((value: string) => {
          return (
            // TODO: Make controllable
            <span key={field.name.concat("_" + value)}>
              <label>
                {value}{" "}
                <input
                  type="checkbox"
                  name={field.name}
                  value={value}
                  checked={curFieldValues.includes(value)}
                />
              </label>{" "}
            </span>
          );
        });
      }
      return (
        <tr key={field.name}>
          <td style={{ textAlign: "left" }}>{field.name}</td>
          <td style={{ textAlign: "right" }}>{options}</td>
        </tr>
      );
    });
  } else {
    tableRows = [
      <tr>
        <td>😐 No properties found...</td>
      </tr>,
    ];
  }

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
                <Form
                  className="w-50 d-flex justify-content-between"
                  ref={fieldFilterForm}
                >
                  <div>
                    <Form.Control
                      type="text"
                      name="filterString"
                      placeholder="Filter for properties..."
                    />
                  </div>
                  <div className="d-flex align-items-center ml-2">
                    {" "}
                    {/* TODO: Looks bad on mobile */}
                    <Form.Check
                      type="checkbox"
                      name="onlyModified"
                      label="Show modified properties only"
                    />
                  </div>
                </Form>
                <div className="d-flex justify-content-between">
                  <Button variant="info" ref={resetPanelButton}>
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
                <form id="filterForm" ref={filterForm}>
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

/**
 * Extracts the values of the filter table form.
 * @param form represents the form to extract the values from.
 * @returns the form values in a two-dimensional array in the form of
 * [Array [PROPERTY_NAME, SELECTED_VALUES]: [string, string[]],
 *  Array [PROPERTY_NAME, SELECTED_VALUES]: [string, string[]]]
 */
function getFormValues(form: any): [[string, string[]]] {
  const formValues: any = [];
  const elements = form.querySelectorAll("input, select");

  for (var i = 0; i < elements.length; ++i) {
    const element = elements[i];
    const name: string = element.name;
    const value = element.value;
    if (name) {
      if (
        element.checked ||
        (element instanceof HTMLSelectElement && value.length > 0)
      ) {
        const existingPropIndex = formValues.findIndex((property: any) => {
          return property[0] === name;
        });
        if (existingPropIndex === -1) {
          formValues.push([name, [value]]);
        } else {
          formValues[existingPropIndex][1].push(value);
        }
      }
    }
  }
  return formValues;
}

/**
 * Parses raw filter data.
 * For the @param filterData the data-structure returned by @function getFormValues is expected.
 * @returns an object that contains the 2 properties "niceToHave" and "required".
 * The niceToHave-property contains an array in the form of:
 * [PROPERTY_NAME, PROPERTY_NAME, ...]: [string] (values are implicit "Nice-To-Have")
 * The required-property contains a two dimensional array in the form (same as input filterData) of:
 * [Array [PROPERTY_NAME, SELECTED_VALUES]: [string, string[]],
 *  Array [PROPERTY_NAME, SELECTED_VALUES]: [string, string[]]]
 */
function parseFilterData(filterData: Array<any>) {
  const filterObj: any = {};
  filterObj["required"] = [];
  filterObj["niceToHave"] = [];

  // TODO: Use Array pattern matching
  filterData.forEach((property) => {
    const name = property[0]; // String
    const value = property[1]; // Array
    const propertyArray = [];

    propertyArray[0] = name;
    if (value.includes("Nice-To-Have") || value.includes("Yes")) {
      // assert !(value.includes("Nice-To-Have") && value.includes("Yes"))
      propertyArray[1] = ["Yes"];
      if (value.includes("Nice-To-Have")) {
        filterObj["niceToHave"].push(name); // In nice-to-have only names get pushed
      } else {
        filterObj["required"].push(propertyArray); // In required the form is PROPERTY_NAME: [SELECTED_PROPERTIES]
      }
    } else if (
      value.some((val: string) => {
        return val.length > 0;
      })
    ) {
      propertyArray[1] = value;
      filterObj["required"].push(propertyArray);
    }
  });
  return filterObj;
}

/**
 * Is called by all select- and input-HTML-Elements
 * while rendering to simulate a two-way-data-binding.
 * @param field represents the field object that is currently in the render pipeline
 * @param filterData represents the current filterData (stored in state of parent component CardList)
 * @returns an array with the values of the elements
 * that are currently selected in the form for the given field
 */
function getFieldValue(field: any, filterData: any): [string] {
  if (filterData) {
    if (field.values.includes("Yes") && field.values.includes("No")) {
      if (
        filterData.niceToHave.some(
          (fieldName: string) => fieldName === field.name
        )
      ) {
        return ["Nice-To-Have"];
      } else if (
        filterData.required.some(
          ([fieldName, _]: [string, string[]]) => fieldName === field.name
        )
      ) {
        return ["Yes"];
      }
    } else {
      // Note: Properties which are not consisting of "Yes" & "No"
      // but of arbitrary values cannot be in Nice-To-Have
      const propIndex = filterData.required.findIndex(
        ([fieldName, _]: [string, string[]]) => fieldName === field.name
      );
      if (propIndex !== -1) {
        return filterData.required[propIndex][1]; // Array
      }
    }
  }
  return [""];
}


/*function constructFieldValues(cmsData: any): Array<any> {
  const fields = cmsData.fields
    .map((field: any) => {
      const fieldObj = Object.create(null);
      fieldObj.name = field.name;
      const values: string[] = [];
      cmsData.cms.forEach((cms: any) => {
        const value = cms[field.name];
        if (value.length > 0 && value !== "Not specified") {
          const regex = new RegExp(values.join("|"), "i"); // Ignore case //TODO: to uppercase
          if (!regex.test(value) || values.length === 0) {
            values.push(cms[field.name]);
          }
        }
      });
      fieldObj.values = values;
      return fieldObj;
    });
  // Filter useless fields, e.g. a property that no CMS or every CMS has
  return fields.filter((field: any) => {
    const values = Object.values(field)[1] as string[]; // TODO: Check logic
    return !(
      (values.includes("Yes") && !values.includes("No")) ||
      (!values.includes("Yes") && values.includes("No"))
    );
  });
}*/




