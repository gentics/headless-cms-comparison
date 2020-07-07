const CMS_REPO_BASE_URL = "https://raw.githubusercontent.com/gentics/headless-cms-comparison/master/";
// TODO: Add 'cms-list.json' to cms-comparison repo and fetch from there
const CMS_LIST_PATH = "./cms-list.json";

let cmsData: any;

const CmsService = {
  getCmsData: function(): Promise<Array<any>> {
    if (!cmsData) {
      cmsData = fetch(CMS_LIST_PATH)
      .then(response => response.json())
      .then(data => {return fetchCmsData(data.cms);})
      .then(rawCmsData => {return cleanUpCmsData(rawCmsData)});
    }
    return cmsData;
  }
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
function fetchCmsData(cmsList: [string]): Promise<Array<any>> {
  let promises: Promise<Array<any>>[] = [];

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
      Object.entries(fields).map((field) => {
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

function cleanUpCmsData(cmsData: any): Array<any> {
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

export default CmsService;