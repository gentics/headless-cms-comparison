import * as React from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import CmsService from './CmsService';
import TreeList, { Column, ColumnChooser, HeaderFilter, SearchPanel, Selection, Lookup } 
from 'devextreme-react/tree-list';

interface CardListState {
  cmsData: Array<any>;
}

const IGNORE_FIELDS = ["Timestamp", "Special Features"];

export default function CardList() {
  const [cmsData, setCmsData] = React.useState<any>();
  React.useEffect(() => {CmsService.getCmsData().then(setCmsData);}, []);
  if(cmsData) {
    const cards = cmsData.cms.map((cms: any) => {
      return (
        <div className={'my-2 mx-2'}>
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
    return (
      <div className="d-flex flex-wrap justify-content-center">
        {<FilterPanel cmsData={cmsData}/>}
        {cards}
      </div>
    );
  } else {
    return (
      <ProgressBar animated now={100} />
    )
  }
}

function FilterPanel(props: any) {
  const fieldValues = constructFieldValues(props.cmsData);
  const listItems = fieldValues.map(field => { // TODO: Add for
    const options = field.values.map((value: string) => {
      return (
        <option value={value}>{value}</option>
      )
    });

    return (<ListGroup.Item className="d-flex justify-content-between">
      <div>
        <input type="checkbox"/>{' '}
        <label>{field.name}</label>
      </div>
      <div>
      <select>
        {options}
      </select>{' '}
      <input type="number" min="1" max="5" style={{width: '3.5em'}}/>
      </div>
    </ListGroup.Item>);
  });
  return (
    <div>
      <ListGroup>
        {listItems}
      </ListGroup>
    </div>
  )
}

function constructFieldValues(cmsData: any): Array<any> {
  return cmsData.fields.filter((field: any) => {
    return !(IGNORE_FIELDS.includes(field.name));
  }).map((field: any) => {
    const fieldObj = Object.create(null);
    fieldObj.name = field.name;
    const values: string[] = ["Don't care"];
    cmsData.cms.forEach((cms: any) => {
      const value = cms[field.name];
      if (value.length > 0 && value !== "Not specified") {
        if (!values.includes(value)) {
          values.push(cms[field.name]);
        }
      }
    });
    fieldObj.values = values;
    return fieldObj;
  });
}