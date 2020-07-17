import * as React from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useFormik, Formik, Field } from 'formik';
import { Cms, FormProperty, BooleanFormProperty, ComplexFormProperty } from "./Cms";

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
    /*filterForm.current.addEventListener("change", (e: any) => {
      const json = parseFilterData(getFormValues(filterForm.current));
      console.log(json);
      props.setFilter(json);
    });*/

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

  /*if (showOnlyModified) {
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
  }*/

  let tableRows: any;
  if (fieldValues.length > 0) {
    tableRows = fieldValues.map((field: any) => {
      // TODO: Add for
      const curFieldValues: string[] = []; // getFieldValue(field, filterData);
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
      {Panel(cmsData)}
      
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

  function Panel(cmsData: {cms: Cms[], fields: any, formProperties: { [index: string]: FormProperty }} ) {
    const formik = useFormik({
      initialValues: {
        showOnlyModified: (cmsData.formProperties.showOnlyModified as BooleanFormProperty).value,
        propertyFilter: (cmsData.formProperties.propertyFilter as ComplexFormProperty).value
      },
      onSubmit: foo => {
        console.log("Bar");
      },
    });
    return (
      <Accordion>
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between">
              <h4 style={{ lineHeight: 1.5, marginBottom: 0 }}>
                Filter Panel
              </h4>
            </div>
            <form onSubmit={formik.handleChange}>
              <input type="text" id="propertyFilter" name="propertyFilter" onChange={formik.handleChange} value={formik.values.propertyFilter as string} />
              <label htmlFor="showOnlyModified">
                <input type="checkbox" id="showOnlyModified" name="showOnlyModified" onChange={formik.handleChange} value={formik.values.showOnlyModified} />
                Show only modified properties
              </label>
            </form>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
              <div style={{ maxHeight: "500px", overflow: "auto" }}>
                <h2>Hier gibt es noch nichts zu sehen...</h2>
              </div>
            </Accordion.Collapse>
        </Card>
      </Accordion>
    );
}