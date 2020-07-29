import {
  Cms,
  CmsProperty,
  BooleanCmsProperty,
  Category,
  License,
  BasicField,
  ScoreField,
  CategoryCmsProperty,
  CategoryField,
  CmsData,
} from "./Cms";
import FilterService from "./FilterService";

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

  getKeysOfSubFields: function (
    category: CategoryCmsProperty | CategoryField
  ): string[] {
    return Object.keys(category).filter(
      (key) => key !== "name" && key !== "description"
    );
  },

  isScoreField: function (x: BasicField): x is ScoreField {
    if (!x) return false;
    return (x as ScoreField).value !== undefined;
  },
};

/**
 * Fetches the CMS-Data from the github-repo
 * @param cmsKeyList represents the list of cms
 * with the names set to match the json-files in the repo.
 * @returns a promise containing all fetch-processes,
 * when resolved the promise returns an object with two properties:
 * fields: Object containing field-properties
 * cms: Array containing cms-objects
 */
function fetchCmsData(cmsKeyList: string[]): Promise<CmsData> {
  let start = Date.now();
  let promises: Promise<any>[] = [];
  cmsKeyList.forEach((cms: string) => {
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

  return Promise.all(promises).then((values) => {
    console.log(`CMS-Fetching took ${Date.now() - start}ms`);
    start = Date.now();
    const fields = values[0];
    let rawCms: Cms[] = values.slice(1);

    cmsKeyList = cmsKeyList.sort().filter((x) => x.toLowerCase() !== "fields");

    rawCms = sortCmsByName(rawCms);

    const parsedCms: { [x: string]: Cms } = {};
    for (let i = 0; i < rawCms.length; i++) {
      parsedCms[cmsKeyList[i]] = parseCms(rawCms[i]);
    }

    console.log(`CMS-Parsing took ${Date.now() - start}ms`);
    return { fields: fields, cms: parsedCms };
  });
}

function sortCmsByName(cmsArray: Cms[]) {
  return cmsArray.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase()
      ? 1
      : b.name.toLowerCase() > a.name.toLowerCase()
      ? -1
      : 0
  );
}

function parseCms(cms: any): Cms {
  // Special parsing for licenses and categories

  // Parse licenses
  const licenses: License[] = cms.license.split("/");
  if (!licensesAreValid(licenses)) {
    console.error(licenses);
    throw new Error(`CMS ${cms.name} has invalid or no licenses!`);
  }
  cms.license = licenses;

  // Parse categories
  const categories: Category[] = cms.category.split("/");
  if (!categoriesAreValid(categories)) {
    console.error(categories);
    throw new Error(`CMS ${cms.name} has invalid or no categories!`);
  }
  cms.category = categories;

  const propertyKeys: string[] = Object.keys(cms.properties);
  for (const key of propertyKeys) {
    const currentProperty: CmsProperty = cms.properties[key];
    if (isBooleanCmsProperty(currentProperty)) {
      currentProperty.value = currentProperty.value === "Yes";
    } else {
      const subPropertyKeys = CmsService.getKeysOfSubFields(currentProperty);
      for (const subKey of subPropertyKeys) {
        const subProperty = currentProperty[subKey];
        subProperty.value = subProperty.value === "Yes";
      }
    }
  }

  /*propertyKeys.forEach((propertyKey: string) => {
    const curProp: CmsProperty = cms.properties[propertyKey];
    if (isBooleanCmsProperty(curProp)) {
      curProp.value = curProp.value === "Yes" ? true : false;
      cms.properties[propertyKey] = curProp;
    } else {
      const curSubPropKeys = CmsService.getKeysOfSubFields(curProp);
      curSubPropKeys.forEach((subPropKey: string) => {
        const subProp = curProp[subPropKey] as BooleanCmsProperty;
        subProp.value = subProp.value === "Yes" ? true : false;
        cms.properties[propertyKey][subPropKey] = subProp;
      });
    }
  });*/
  return cms;
}

function licensesAreValid(licenses: string[]): boolean {
  return (
    licenses.length > 0 &&
    FilterService.getArrayIntersection(Object.values(License), licenses)
      .length === licenses.length
  );
}

function categoriesAreValid(categories: string[]): boolean {
  return (
    categories.length > 0 &&
    FilterService.getArrayIntersection(Object.values(Category), categories)
      .length === categories.length
  );
}

function isBooleanCmsProperty(x: CmsProperty): x is BooleanCmsProperty {
  if (!x) return false;
  return (x as BooleanCmsProperty).value !== undefined;
}

export default CmsService;
