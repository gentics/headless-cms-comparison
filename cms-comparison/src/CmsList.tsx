import * as React from 'react';
import { render } from '@testing-library/react';
import ProgressBar from 'react-bootstrap/ProgressBar'

const CMS_REPO_BASE_URL = "https://raw.githubusercontent.com/gentics/headless-cms-comparison/master/"; 

export default function CmsList() {
  // TODO: Add 'cms-list.json' to cms-comparison repo and fetch from there
  const [cmsData, setCmsData] = React.useState<any>();
  // Is called once at startup, when fetch is finished state is set to the fetch-results
  React.useEffect(() => {
    fetch('cms-list.json')
                  .then(response => response.json())
                  .then(data => {/*console.log(data.cms);*/ return fetchCmsData(data.cms);})
                  .then(setCmsData);
  }, []);
  
  // Show progressBar as long as fetch is not completed, otherwise table
  if (cmsData) {
    // TODO: Construct cols
    let cols = [];
    /*
    cols.push(<Column key = "fieldName" field = {cmsData.fields.name} header = "Property"/>);
    cols.push(<Column key = "description" field = {cmsData.fields.description} header = "Description"/>);
    

    cols.push(cmsData.cms.map((cms, i) => {
    }));

    console.log(cols);*/

    return (
      <div>
        <h3>Fetch completed!</h3>
        
      </div>
    );
  } else {
    return (
      <ProgressBar animated now={100} />
    );
  }
    
}

function fetchCmsData(cmsList: [string]) {
  let promises = [];

  for (let cms of cmsList) {
    promises.push(fetch(CMS_REPO_BASE_URL + cms + ".json")
                  .then(response => response.json())
                  .then(data => {
                    let cmsObj = Object.create(null);
                    cmsObj.name = cms;
                    cmsObj.data = data;
                    return cmsObj;
                  }));
  }

  const start = Date.now();
  return Promise.all(promises).then((values) => {
    // [DEBUG] Measure time for fetch...
    const end = Date.now();
    const elapsed = end - start;
    console.log("Fetch took " + elapsed + "ms");

    // Move 'fields'-array and cms-entries in seperate Object-Properties
    const fieldsIndex = values.findIndex(entry => entry.name === "fields");
    const fields = values[fieldsIndex];
    values.splice(fieldsIndex, 1); // Remove from values
    
    const resObj = Object.create(null);

    // Convert fields into objects 
    resObj.fields = Object.entries(fields.data).map((field, i) => {
      const obj = Object.create(null);
      obj.name = field[0];
      obj.description = field[1];
      return obj;
    });
    
    resObj.cms = values;
    console.log(resObj);
    
    return resObj;
  });
}