import * as React from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import CmsService from './CmsService';
import Table from 'react-bootstrap/Table';
import Accordion from 'react-bootstrap/Accordion'

const IGNORE_FIELDS = [
  "Timestamp",
  "Special Features",
  "Name",
  "Version",
  "Inception",
  "Content Relations"];

export default function CardList() {
  const [cmsData, setCmsData] = React.useState<any>();
  const [filterData, setFilterData] = React.useState<any>();
  React.useEffect(() => {console.log("Fetching"); CmsService.getCmsData().then(setCmsData);}, []);
  React.useEffect(() => {console.log("Filter updated!"); console.log(filterData);}, [filterData])
  
  const updateFilter = function(filter: Array<any>) {
    setFilterData(filter);
  }

  if(cmsData) {
    const cards = constructCards(cmsData, filterData);
    
    return (
      <div>      
        <div className="d-flex justify-content-center">
          <div className="w-75">
          <Accordion>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between">
                  <h4>Filter Panel</h4>
                  <Accordion.Toggle as={Button} variant="secondary" eventKey="0">
                    Toggle
                  </Accordion.Toggle>
                </div>
              </Card.Header>
              <Accordion.Collapse eventKey="0">
                <FilterPanel cmsData={cmsData} updateFilter={updateFilter}/>
              </Accordion.Collapse>
            </Card>
          </Accordion>
          </div>
        </div>
        <div className="d-flex flex-wrap justify-content-center">
          {cards}
        </div>
      </div>
    );
  } else {
    return (
      <ProgressBar animated now={100} />
    )
  }
}

function constructCards(cmsData: any, filterData: Array<any>): Array<any> {
  let filteredCms;
  if (filterData) {
    const entries = Object.entries(filterData);
    filteredCms = cmsData.cms.filter((cms: any) => {
      return entries.every(property => {
        const name = property[0]; // String
        const filterValues = property[1]; // Array
        // return true, if a specific cms property does contain all specified values
        return filterValues.some((value: string) => {return cms[name].includes(value)});
      });
    });
  } else {
    filteredCms = cmsData.cms;
  }

  if (filteredCms.length === 0) {
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
    return filteredCms.map((cms: any) => {
      return (
        <div className={'my-2 mx-2'} key={cms.Name}>
          <Card style={{ width: '18rem' }} className={'cmsCard'}>
            <Card.Body>
              <Card.Title>{cms.Name}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">Version {cms.Version}</Card.Subtitle>
              <Card.Text>
                Beispieltext, eventuell Featureabeckung-Prozente?
              </Card.Text>
              <Button variant="info">Details</Button>
            </Card.Body>
          </Card>
        </div>
      );
    });
  }
  
}

function FilterPanel(props: any) {
  const filterForm = React.useRef<any>();

  React.useEffect(() => {
    filterForm.current.addEventListener('submit', (e: any) => {
      e.preventDefault();
      const json = getFormValues(filterForm.current);
      console.log(json);
      props.updateFilter(json);
    });
  }, []); // On mount, add eventListener to form
  
  const fieldValues = constructFieldValues(props.cmsData);

  const tableRows = fieldValues.map(field => { // TODO: Add for
    const options = field.values.sort().map((value: string) => {
      return (
        <span key={field.name.concat("_" + value)}><input type="checkbox" name={field.name} value={value} />{' '}<label>{value}</label>{' '}</span>
      )
    });
    return (
      <tr key={field.name}>
        <td style={{textAlign: "left"}}>{field.name}</td>
        <td style={{textAlign: "right"}}>
          {options}
        </td>
      </tr>
    );
  });

  return (
    <div>
      <form id="filterForm" ref={filterForm}>
        <Table striped bordered hover>
          <tbody>
            {tableRows}
          </tbody>
        </Table>
        <div className="d-flex justify-content-end mb-2 mx-2">
          <Button variant="secondary" className="mr-1" disabled>Maybe Filter-Export possibility?</Button>
          <input className="btn btn-success" type="submit" value="Apply filter" />
        </div>
      </form>
    </div>
  )
}

function constructFieldValues(cmsData: any): Array<any> {
  return cmsData.fields.filter((field: any) => {
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
}

function getFormValues(form: any) {
  var obj:any = {};
  var elements = form.querySelectorAll( "input, select" ); // TODO: Check which ones are used
  for( var i = 0; i < elements.length; ++i ) {
    var element = elements[i];
    var name:string = element.name;
    var value = element.value;
    if( name ) {
      if (element.checked) {
        if (obj[name]) {
          obj[name].push(value);
        } else {
          obj[name] = [value];
        }
      }
    }
  }
  return obj;
}