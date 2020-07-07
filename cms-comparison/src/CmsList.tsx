import * as React from 'react';
import { render } from '@testing-library/react';
import ProgressBar from 'react-bootstrap/ProgressBar'
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import DataGrid, {
  Column,
  Grouping,
  Paging,
  SearchPanel,
  Scrolling,
  Sorting,
  FilterRow
} from 'devextreme-react/data-grid';


const CMS_REPO_BASE_URL = "https://raw.githubusercontent.com/gentics/headless-cms-comparison/master/"; 

export default function CmsList() {
  // TODO: Add 'cms-list.json' to cms-comparison repo and fetch from there
  const [cmsData, setCmsData] = React.useState<any>();
  // Is called once at startup, when fetch is finished state is set to the fetch-results
  React.useEffect(() => {
    fetch('cms-list.json')
                  .then(response => response.json())
                  .then(data => {return fetchCmsData(data.cms);})
                  .then(rawCmsData => {return cleanUpCmsData(rawCmsData)})
                  .then(setCmsData);
  }, []);
  
  // Show progressBar as long as fetch is not completed, otherwise table
  if (cmsData) {
    const cols = constructColumns(cmsData.fields);
    return (
      <div>
         <DataGrid
          dataSource={cmsData.cms}
          showBorders={true}
          columnAutoWidth={true}
          hoverStateEnabled={true}
          selection={{ mode: 'single' }}
          height={800}
        >
          <FilterRow visible={true} />
          <Sorting mode="multiple" />
          <SearchPanel visible={true} highlightCaseSensitive={true} />
          <Grouping autoExpandAll={false} />
          <Scrolling mode="standard" />
          <Paging enabled={false} />
          {cols}
        </DataGrid>
      </div>
    );
  } else {
    return (
      <ProgressBar animated now={100} />
    );
  }
    
}

function softSanitizeFields(fields: Array<any>): Array<any> {
  fields.forEach(field => {
    field.name = field.name.replace("[","(").replace("]",")").replace(".","_");
  });
  return fields;
}

function softSanitizeCms(cms: Array<any>): Array<any> {
  return cms.map(cms => {
    let sanCms = Object.create(null);
    const properties = Object.entries(cms);
    
    properties.forEach(property => {
      const sanProp = property[0].replace("[","(").replace("]",")").replace(".","_");
      sanCms[sanProp] = property[1];
    });
    return sanCms;
  });
}



function cleanUpCmsData(cmsData: any) {
  cmsData.cms = cmsData.cms.map((cms: Array<any>) => {
    const obj = Object.create(null);
    Object.entries(cms).forEach(([property, value]) => {
      obj[property] = value.replace("?","Not specified");
      if (obj[property].length === 0) {
        obj[property] = "Not specified";
      }
    });
    return obj;
  });
  return cmsData;
}


/**
 * Constructs the columns for the DataTable by categorizing certain properties
 * @param fields represents the available property fields in the table
 * @returns an array containing the columns
 */
function constructColumns(fields: Array<any>): Array<any> {
  let cols: any[] = [];
  let categoryCols: any[] = [];
  let activeCategory = "";

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const fieldCategory = field.name.split('(')[0];
    const fieldHasCategory = fieldCategory.length < field.name.length;
    

    if (fieldHasCategory) {
      if (activeCategory.length > 0) {
        if (fieldCategory === activeCategory) {
          categoryCols.push(<Column dataField={field.name} dataType="string" />);
        } else {
          cols.push(<Column caption={activeCategory}>{categoryCols}</Column>);
          categoryCols = [];
          categoryCols.push(<Column dataField={field.name} dataType="string" />);
          activeCategory = fieldCategory;
        }
      } else {
        // assert (categoryCols.length === 0);
        categoryCols.push(<Column dataField={field.name} dataType="string" />);
        activeCategory = fieldCategory;
      }
    } else {
      if (activeCategory.length > 0) {
        cols.push(<Column caption={activeCategory}>{categoryCols}</Column>);
        categoryCols = [];
        activeCategory = "";
      }
      cols.push(<Column dataField={field.name} dataType="string" 
      width={field.name === "Name" ? 200 : "auto"} 
      fixed={field.name === "Name" ? true : false }/>);
    }
  }
  return cols;
}

/**
 * Fetches the CMS-Data from the github-repo
 * @param cmsList represents the list of cms 
 * with the names set to match the json-files in the repo. 
 * @returns a promise containing all fetch-processes, 
 * when resolved the promise returns an object in the form of
 * fields: Array of fields [name: ... , description: ...]
 * cms: Array of cms [Timestamp: ..., Name: ..., License: ..., etc.]
 */
function fetchCmsData(cmsList: [string]): Promise<void> {
  let promises: Promise<void>[] = [];

  cmsList.forEach(cms => {
    promises.push(fetch(CMS_REPO_BASE_URL + cms + ".json")
    .then(response => response.json())
    .then(data => {
      return data;
    }))
  });

  const start = Date.now();
  return Promise.all(promises).then((values) => {
    // [DEBUG] Measure time for fetch...
    const end = Date.now();
    const elapsed = end - start;
    console.log("Fetch took " + elapsed + "ms");

    // Move 'fields'-array and cms-entries in seperate Object-Properties
    const fields = values[0];
    values.splice(0, 1); // Remove from values
    
    const resObj = Object.create(null);

    // Convert fields into objects 
    resObj.fields = softSanitizeFields(
      Object.entries(fields as unknown as Object).map((field) => {
      const obj = Object.create(null);
      obj.name = field[0];
      obj.description = field[1];
      return obj;
    }));
    resObj.cms = softSanitizeCms(values);

    console.log(resObj);
    
    return resObj;
  });
}

/**
 * OBSOLETE
 * Transposes the CMS-Data objects.
 * Data for every CMS is initially encapsulated in seperate objects which contain
 * all properties in the structure [PROPERTY_NAME]: PROPERTY_VALUE. 
 * However, the axises are inverted, therefore we need objects in the form of 
 * [CMS_NAME]: PROPERTY_VALUE for every property (row).
 * This method returns an array of length 'fields' containing objects
 * in the mentioned format.
 * @param fields represent the available fields 
 * @param cms represent the cms and their data
 */
function getTransposedCmsData(fields: Array<any>, cms: Array<any>): Array<Object> {
  const cmsData = [];
  for (let j = 0; j < fields.length; j++) {
    const fieldObj = Object.create(null);
    fieldObj.Property = fields[j].name;
    fieldObj.Description = fields[j].description;
    for (let i = 0; i < cms.length; i++) {
      fieldObj[cms[i].Name] = Object.values(cms[i])[j];
    }
    cmsData.push(fieldObj);
  }
  console.log(cmsData);
  return cmsData;
}