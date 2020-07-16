import { Cms, Property, SimpleProperty, CategoryProperty } from "./Cms";
import { License } from "./Cms";
import { stringify } from "querystring";

const CMS_REPO_BASE_URL =
  "https://raw.githubusercontent.com/gentics/headless-cms-comparison/refactor/";
// TODO: Add 'cms-list.json' to cms-comparison repo and fetch from there
const CMS_LIST_PATH = "./cms-list.json";

let cmsData: Promise<any>; // TODO: Difficulties while typing Promises

const CmsService = {
  getCmsData: function (): Promise<any> {
    if (!cmsData) {
      cmsData = fetch(CMS_LIST_PATH)
        .then((response) => response.json())
        .then((data) => {
          return fetchCmsData(data.cms);
        })
        .then((rawCmsData) => {
          return rawCmsData;
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
 * when resolved the promise returns an object with two properties:
 * fields: Object containing field-properties
 * cms: Array containing cms-objects
 */
function fetchCmsData(cmsList: string[]): Promise<any> {
  let promises: Promise<any>[] = [];

  /*
  <
    | Array<Cms>
    | {
        lastUpdated: DescriptionField;
        name: DescriptionField;
        version: DescriptionField;
        license: DescriptionField;
        inception: DescriptionField;
        category: DescriptionField;
        properties: any;
      }
  >[]
  */

  cmsList.forEach((cms: string) => {
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

    const cmsData = {
      fields: values[0],
      cms: values.slice(1).map((cms: Cms) => parseCms(cms)),
    };
    
    console.log(cmsData);
    return cmsData;
  });
}

/**
 * Looks at each property of a cms and replaces 
 * Yes's and No's with their equivalent boolean values
 */
function parseCms(cms: Cms): Cms {
  const start = Date.now();
  const propertyKeys: string[] = Object.keys(cms.properties);
  propertyKeys.forEach((propertyKey: string) => {
    // Is property a simple property?
    const property: Property = cms.properties[propertyKey];
    if (isSimpleProperty(property)) {
      // Yes? Replace Yes's with true and No's with false
      const value = property.value;
      property.value = value === "Yes" ? true : value === "No" ? false : value;
      cms.properties[propertyKey] = property;
    } else if (isCategoryProperty(property)) {
      // No? Look into the sub-properties and do the same replacing as above.
      const subPropertyKeys = Object.keys(property);
      subPropertyKeys.forEach((subPropertyKey: string) => {
        const subProperty: Property = property[subPropertyKey];
        if (isSimpleProperty(subProperty)) {
          const value = subProperty.value;
          subProperty.value =
            value === "Yes" ? true : value === "No" ? false : value;
          cms.properties[propertyKey] = subProperty;
        }
      });
    }
  });
  console.log(cms);
  console.log(`Parsing of CMS ${cms.name} took ${Date.now() - start}ms`);
  return cms;
}

function isSimpleProperty(
  x: SimpleProperty | CategoryProperty
): x is SimpleProperty {
  return (x as SimpleProperty).value !== undefined;
}

function isCategoryProperty(
  x: SimpleProperty | CategoryProperty
): x is CategoryProperty {
  return (x as CategoryProperty).value === undefined;
}

export default CmsService;

/////////////////////////////////////////////////////////////////
// BECAUSE OF A MAJOR REFACTOR, THE FOLLOWING CODE IS OBSOLETE //
/////////////////////////////////////////////////////////////////

/**
 * Replaces special chars which interfere with devextreme datagrid with safe chars
 */
/*function softSanitizeFields(
  fields: Array<{ name: string; description: string }>
): Array<{ name: string; description: string }> {
  return fields.map((field) => {
    return {
      name: field.name.replace("[", "(").replace("]", ")").replace(".", "_"),
      description: field.description,
    };
  });
}*/

/*function softSanitizeCms(cms: Array<any>): Array<any> {
  return cms;
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
}*/

/*function cleanUpCmsData(cmsData: any): Array<any> {
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
}*/

// This function was needed to transform the old JSON format into the new one.
// This method has fulfilled it's purpose and is safe to delete.

/*function reformatCms(fields: Array<any>, cms: any): Cms {
  const cmsEntries: [string, string][] = Object.entries(cms);
  let cmsFields: [string, any][] = Object.entries(
    fields[fields.length - 1].description
  );
  const properties: {
    [key: string]: {
      name: string;
      [x: string]:
        | { name: string; description?: string; value: FieldType }
        | FieldType;
    };
  } = {};

  cmsFields.forEach(
    ([propertyName, propertyObject]: [
      string,
      {
        name: string;
        [x: string]:
          | { name: string; description?: string; value: FieldType }
          | FieldType;
      }
    ]) => {
      delete propertyObject.description;
      const propertyDisplayName: string = propertyObject.name;
      const propertyIsCategory: boolean = !propertyObject.hasOwnProperty(
        "value"
      );

      if (propertyIsCategory) {
        delete propertyObject.description;

        const propName = propertyObject.name;
        delete propertyObject.name; // Temp remove name!
        let propertySubPropertyNames = Object.keys(propertyObject);
        let propertySubProperties = Object.values(propertyObject);
        propertyObject.name = propName; // Add name back!
        propertySubProperties.forEach((property: any, index: number) => {
          delete property.description;
          if (cms[property.name]) {
            const value = cms[property.name];
            property.value = (value === "NA" || value === "?" || value === "-") ? null : value;
            propertyObject[propertySubPropertyNames[index]] = property;
          } else if (cms[`${propertyDisplayName} ${property.name}`]) {
            const value = cms[`${propertyDisplayName} ${property.name}`];
            property.value = (value === "NA" || value === "?" || value === "-") ? null : value;
            propertyObject[propertySubPropertyNames[index]] = property;
          } else {
            // Conduct deep search
            const propIndex = cmsEntries.findIndex(
              ([name, _]: [string, string]) =>
                name.toUpperCase().includes(property.name.toUpperCase())
            );
            if (propIndex !== -1) {
              const value = cms[cmsEntries[propIndex][0]];
              property.value = (value === "NA" || value === "?" || value === "-") ? null : value;
              propertyObject[propertySubPropertyNames[index]] = property;
            }
          }
        });
      } else {
        if (cms[propertyDisplayName]) {
          const value = cms[propertyDisplayName];
          propertyObject.value = (value === "NA" || value === "?" || value === "-") ? null : value;
        }
      }
      properties[propertyName] = propertyObject;
    }
  );

  const categories: string[] = cms["Category"].split(" - ");
  const hasEssential = categories.some(
    (str) => str.toUpperCase() === "ESSENTIAL"
  );
  const hasProfessional = categories.some(
    (str) => str.toUpperCase() === "PROFESSIONAL"
  );
  const hasEnterprise = categories.some(
    (str) => str.toUpperCase() === "ENTERPRISE"
  );

  let preparedCms: Cms = {
    lastUpdated: cms.Timestamp.slice(0, 10),
    name: cms.Name,
    version: cms.Version,
    license: getLicense(cms.License),
    inception: cms.Inception,
    category: {
      essential: hasEssential,
      professional: hasProfessional,
      enterprise: hasEnterprise,
    },
    properties: properties,
  };

  console.log(preparedCms);
  console.log(JSON.stringify(preparedCms, undefined, 2));
  return preparedCms;
}

function getLicense(licenseString: string): License[] {
  let result: License[] = [];

  if (licenseString.includes("BSD")) {
    result.push(License.BSD_3);
  }
  if (licenseString.includes("Apache")) {
    result.push(License.Apache_2);
  }
  if (licenseString.includes("GPL")) {
    result.push(License.GPLv3);
  }
  if (licenseString.includes("Freemium")) {
    result.push(License.Freemium);
  }
  if (licenseString.includes("Commercial")) {
    result.push(License.Commercial);
  }
  if (licenseString.includes("Proprietary")) {
    result.push(License.Proprietary);
  }
  if (licenseString.includes("MIT")) {
    result.push(License.MIT);
  }

  if (result.length === 0) {
    console.log(`No license found in ${licenseString}.`);
    return [License.Other];
  }
  return result;
}*/
