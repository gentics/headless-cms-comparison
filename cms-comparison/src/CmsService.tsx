import { Cms } from './Cms';

const CMS_REPO_BASE_URL =
  "https://raw.githubusercontent.com/gentics/headless-cms-comparison/master/";
// TODO: Add 'cms-list.json' to cms-comparison repo and fetch from there
const CMS_LIST_PATH = "./cms-list.json";

let cmsData: any; //TODO: Type

const CmsService = {
  getCmsData: function (): Promise<Array<any>> {
    if (!cmsData) {
      cmsData = fetch(CMS_LIST_PATH)
        .then((response) => response.json())
        .then((data) => {
          return fetchCmsData(data.cms);
        })
        .then((rawCmsData) => {
          return cleanUpCmsData(rawCmsData);
        });
    }
    return cmsData;
  },
};

/**
 * Fetches the CMS-Data from the github-repo
 * @param cmsList represents the list of cms
 * with the names set to match the json-files in the repo.
 * @returns a promise containing all fetch-processes,
 * when resolved the promise returns an object in the form of
 * fields: Array of fields [name: ... , description: ...]
 * cms: Array of cms-objects [{Timestamp: ..., Name: ..., License: ..., etc.}, {...}, ...]
 */
function fetchCmsData(cmsList: [string]): Promise<any> {
  let promises: Promise<Array<any>>[] = [];

  cmsList.forEach((cms) => {
    promises.push(
      fetch(CMS_REPO_BASE_URL + cms + ".json")
        .then((response) => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then((data) => {
          return data;
        })
    );
  });

  const start = Date.now();
  return Promise.all(promises).then((values) => {
    const elapsed = Date.now() - start;
    console.log(`Fetch took ${elapsed} ms`);

    // Move 'fields'-array and cms-entries in seperate Object-Properties
    const fields = values[0];
    const cmsData = {
      fields: softSanitizeFields(
        Object.entries(fields).map(([n, d]: [string, string]) => {
          return { name: n, description: d };
        })
      ),
      cms: softSanitizeCms(values.slice(1)),
    };

    console.log(cmsData);
    return cmsData;
  });
}

/**
 * Replaces special chars which interfere with devextreme datagrid with safe chars
 */
function softSanitizeFields(
  fields: Array<{ name: string; description: string }>
): Array<{ name: string; description: string }> {
  return fields.map((field) => {
    return {
      name: field.name.replace("[", "(").replace("]", ")").replace(".", "_"),
      description: field.description,
    };
  });
}

function prepareCms(cms: any): Cms {
  let preparedCms: Cms;
  preparedCms.name = cms.Name;
  
}

function softSanitizeCms(cms: Array<any>): Array<any> {
  return cms.map((cms) => {
    let sanCms = Object.create(null);
    const properties = Object.entries(cms);

    properties.forEach((property) => {
      const sanProp = property[0]
        .replace("[", "(")
        .replace("]", ")")
        .replace(".", "_");
      sanCms[sanProp] = property[1];
    });
    return sanCms;
  });
}

function cleanUpCmsData(cmsData: any): Array<any> {
  cmsData.cms = cmsData.cms.map((cms: Array<any>) => {
    const obj = Object.create(null);
    Object.entries(cms).forEach(([property, value]) => {
      obj[property] = value.replace("?", "Not specified");
      if (obj[property].length === 0) {
        obj[property] = "Not specified";
      }
    });
    return obj;
  });
  return cmsData;
}

export default CmsService;
