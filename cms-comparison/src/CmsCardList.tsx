import * as React from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Alert from 'react-bootstrap/Alert';
import CmsService from './CmsService';
import Table from 'react-bootstrap/Table';
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form'
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillLike } from "react-icons/ai";
import { AiFillDislike } from "react-icons/ai";
import { AiFillStar } from "react-icons/ai";


const IGNORE_FIELDS = [
  "Timestamp",
  "Special Features",
  "Name",
  "Version",
  "Inception",
  "Content Relations"];

export default function CardList() {
  const [cmsData, setCmsData] = React.useState<any>();
  const [filterData, setFilterData] = React.useState<any>(null);
  const [fetchError, setFetchError] = React.useState<any>(null);
  React.useEffect(() => {
    console.log("Fetching..."); 
    CmsService.getCmsData()
    .then(setCmsData)
    .catch(e => {console.log("Error detected!"); setFetchError(e)});}
  , []);
  React.useEffect(() => {console.log("Filter updated!"); console.log(filterData);}, [filterData])
  
  const updateFilter = function(filter: Array<any>) {
    setFilterData(filter);
  }

  if(cmsData) {
    const cards = constructCards(cmsData, filterData);
    return (
      <div>      
        <FilterPanel cmsData={cmsData} updateFilter={updateFilter}/>
        <div className="d-flex flex-wrap justify-content-center">
          {cards}
        </div>
      </div>
    );
  } else if (fetchError) {
    return (
      <Alert variant="danger">
        An error occurred while fetching: {fetchError.message}
    </Alert>
    );
  } else {
    return (
      <ProgressBar animated now={100} />
    );
  }
}

function constructCards(cmsData: any, filterData: Array<any>): Array<any> {
  console.log("ConstructCards() is called!");
  let filter: any;
  if (filterData) {
    filter = parseFilterData(filterData);
    console.log(filter);
    const requiredCms: any[] = [];
    cmsData.cms.forEach((cms: any) => {
      const matchingProperties: string[][] = [];
      const cmsIsValid = filter.required.every((property: Array<any>) => {
        const name = property[0]; // String
        // return true, if a specific cms property does contain at least one specified value
        const matchingProperty =
        property[1].find((value: string) => {return cms[name].includes(value)});
        if (!matchingProperty) {
          return false;
        } else {
          matchingProperties.push([name, matchingProperty]);
          return true;  
        }
      });
      if (cmsIsValid) {
        const resObj = Object.create(null);
        resObj["cms"] = cms;
        resObj["required"] = matchingProperties;
        requiredCms.push(resObj);
      }
    });

    filter = requiredCms.map((tupel: any) => {
      const niceToHave: string[][] = [];
      filter["niceToHave"].forEach((property: string) => {
        niceToHave.push([
          property,
          tupel.cms[property].includes("Yes") ? "Yes" : "No"
        ]);
      });
      tupel["niceToHave"] = niceToHave;
      return tupel; // Now tripel
    });

  } else {
    filter = cmsData.cms.map((cms: any) => {
      const resObj = Object.create(null);
      resObj["cms"] = cms;
      resObj["required"] = [];
      resObj["niceToHave"] = []; 
      return resObj;
    });
  }

  console.log(filter);

  if (filter.length === 0) {
    return[(
      <div className={'my-2 mx-2 w-75'}>
        <Card>
          <Card.Body>
            <Card.Title>😐 No CMS matches your requirements...</Card.Title>
            <Card.Text>
              De-select some of the specified requirements and try again!
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    )];
  } else {
    return filter.map((tripel: any) => {
      const requiredProgress = 
      (tripel.required.length > 0 || tripel.niceToHave.length > 0) ? 
      (tripel.required.length / (tripel.required.length + tripel.niceToHave.length)) * 100 : 0;

      const niceToHaveProgress = 
      (tripel.niceToHave.length > 0) ? (tripel.niceToHave.filter((property:Array<any>) => {
        return property[1] === "Yes"
      }).length / (tripel.required.length + tripel.niceToHave.length)
      ) * 100 : 0;

      const niceToHaveShare = 
      (tripel.niceToHave.length > 0) ? (tripel.niceToHave.filter((property:Array<any>) => {
        return property[1] === "Yes"
      }).length / tripel.niceToHave.length  * 100) : 0;

      const requiredText = tripel.required.length > 0 ? 
      <li><AiFillCheckCircle />{' '}Matches all needed requirements</li> : <li></li>;

      const niceToHaveText = tripel.niceToHave.length > 0 ? 
      <li>{(niceToHaveShare > 0) ? ((niceToHaveShare === 100) ? <AiFillStar /> : <AiFillLike />) : <AiFillDislike />}
      {' '}Has {(niceToHaveShare > 0) ? (niceToHaveShare.toFixed(0) + "% ") : "none "} 
      of the specified Nice-To-Have's.</li> : <li></li>; 
      
      const progressBars = (tripel.required.length > 0 || tripel.niceToHave.length > 0) ?
      <ProgressBar className="mb-2">
        <ProgressBar key={1} animated variant="info"
          now={requiredProgress} />
        <ProgressBar key={2} animated variant="warning" 
          now={niceToHaveProgress} />
      </ProgressBar> : <p></p>;

      return (
        <div className={'my-2 mx-2'} key={tripel.cms.Name}>
          <Card style={{ width: '18rem' }} className={'cmsCard'}>
            <Card.Body style={{textAlign: "left"}} >
              <Card.Title>{tripel.cms.Name}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                Version {tripel.cms.Version}
              </Card.Subtitle>
              <Card.Text>
                <ul style={{listStyle: "none", paddingLeft: 0}}>
                  {requiredText}
                  {niceToHaveText}
                </ul>
              </Card.Text>
              {progressBars}
              <div className="d-flex justify-content-start"><Button variant="info">Details</Button></div>
            </Card.Body>
          </Card>
        </div>
      );
    });
  }
}

function FilterPanel(props: any) {
  const filterForm = React.useRef<any>();
  const fieldFilterForm = React.useRef<any>();
  const resetPanelButton = React.useRef<any>();

  const [fieldFilter, setFieldFilter] = React.useState<any>(["",false]);

  React.useEffect(() => {
    console.log("FieldFilter updated!");
    console.log(fieldFilter);
  }, [fieldFilter])

  React.useEffect(() => {
    filterForm.current.addEventListener('change', (e: any) => {
      const json = getFormValues(filterForm.current);
      props.updateFilter(json);
    });

    fieldFilterForm.current.addEventListener('input', (e: any) => {
      const form = fieldFilterForm.current.querySelectorAll("input");
      setFieldFilter([form[0].value, form[1].checked]);
    });

    resetPanelButton.current.addEventListener('click', (e: any) => {
      fieldFilterForm.current.reset();
      setFieldFilter(["",false]);
      filterForm.current.reset();
      props.updateFilter(null);
    });
  }, []); // On mount, add eventListeners to forms

  let fieldValues = constructFieldValues(props.cmsData);

  if (fieldFilter[1]) {
    const filter = getFormValues(filterForm.current);
    const modifiedFields = filter.filter((property: Array<any>) => {
      return property[1].length > 0 && property[1][0].length > 0;
    });
    fieldValues = fieldValues.filter(field => {
      return modifiedFields.some((modField:any) => {return modField.includes(field.name)});
    });
  }

  if (fieldFilter[0].length > 0) {
    fieldValues = fieldValues.filter(field => {
      return field.name.toUpperCase().includes(fieldFilter[0].toUpperCase());
    }); // TODO: BUG: When filtering and no match, form gets reset
  }

  let tableRows: any;
  if (fieldValues.length > 0) {
    tableRows = fieldValues.map(field => { // TODO: Add for
      let options = [];
      if (field.values.includes("Yes") && field.values.includes("No")) {
        options.push(
          <option key={field.name.concat("_" + 0)} value="" defaultChecked={true}>don't care</option>
        );
        options.push(
          <option key={field.name.concat("_" + 1)} value="Nice-To-Have">nice-to-have</option>
        );
        options.push(
          <option key={field.name.concat("_" + 2)} value="Yes">required</option>
        );
        options = [
          <select name={field.name}>
            {options}
          </select>
        ];
      } else {
        options = field.values.sort().map((value: string) => {
          return (
            <span key={field.name.concat("_" + value)}><label>{value}{' '}<input type="checkbox" name={field.name} value={value}/></label>{' '}</span>
          )
        });
      }
      return (
        <tr key={field.name}>
          <td style={{textAlign: "left"}}>{field.name}</td>
          <td style={{textAlign: "right"}}>
            {options}
          </td>
        </tr>
      );
    });
  } else {
    tableRows = [
    <tr>
      <td>😐 No properties found...</td>
    </tr>
    ];
  }

  return (
    <div className="d-flex justify-content-center">
      <div className="w-75">
      <Accordion>
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between">
              <h4 style={{lineHeight: 1.5, marginBottom: 0}}>Filter Panel</h4>
              <Form className="w-50 d-flex justify-content-between" ref={fieldFilterForm}>
                <div>
                  <Form.Control type="text" name="filterString" placeholder="Filter for properties..." />
                </div>
                <div className="d-flex align-items-center ml-2"> {/* TODO: Looks bad on mobile */}
                  <Form.Check type="checkbox" name="onlyModified" label="Show modified properties only" />
                </div>
              </Form>
              <div className="d-flex justify-content-between">
                <Button variant="info" ref={resetPanelButton}>Clear</Button>
                <Accordion.Toggle as={Button} variant="secondary" eventKey="0" className="ml-2">
                  Toggle
                </Accordion.Toggle>
              </div>
            </div>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <div style={{maxHeight: "500px", overflow: "auto"}}>
              <form id="filterForm" ref={filterForm}>
                <Table striped bordered hover className="mb-0">
                  <tbody>
                    {tableRows}
                  </tbody>
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
  )
}

function constructFieldValues(cmsData: any): Array<any> {
  const fields = cmsData.fields.filter((field: any) => {
    return !(IGNORE_FIELDS.includes(field.name));
  }).map((field: any) => {
    const fieldObj = Object.create(null);
    fieldObj.name = field.name;
    const values: string[] = [];
    cmsData.cms.forEach((cms: any) => {
      const value = cms[field.name];
      if (value.length > 0 && value !== "Not specified") {
        const regex = new RegExp(values.join("|"), "i") // Ignore case
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
    const values = Object.values(field)[1] as string[];
    return !((values.includes("Yes") && !values.includes("No")) || 
           (!values.includes("Yes") && values.includes("No")));
  });
}

function getFormValues(form: any) {
  const formValues: any = [];
  const elements = form.querySelectorAll( "input, select" );

  for( var i = 0; i < elements.length; ++i ) {
    const element = elements[i];
    const name:string = element.name;
    const value = element.value;
    if(name) {
      if (element.checked || (element instanceof HTMLSelectElement && value.length > 0)) {
        const existingPropIndex = formValues.findIndex((property: any) => {return property[0] === name});
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
 * Parses filter data in an object that contains the 2 properties "niceToHave" and "required".
 * Each of the two object-properties contains an array of arrays in the form of:
 * Array [PROPERTY_NAME, SELECTED_VALUE]
 */
function parseFilterData(filterData: Array<any>) {
  const filterObj:any = {};
  filterObj["required"] = [];
  filterObj["niceToHave"] = [];
  

  filterData.forEach(property => {
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
    } else if (value.some((val:string) => {return val.length > 0})) {
      propertyArray[1] = value;
      filterObj["required"].push(propertyArray);
    }
  });
  return filterObj;
}