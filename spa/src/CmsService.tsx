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
  PropertyType,
  ReceivedCmsData,
} from "./Cms";
import FilterService from "./FilterService";

const CMS_REPO_BASE_URL =
  "https://raw.githubusercontent.com/gentics/headless-cms-comparison/master/";
const CMS_LIST_PATH = `${CMS_REPO_BASE_URL}/cms-list.json`;

let cmsData: Promise<any>;

const CmsService = {
  getCmsData: function (): Promise<any> {
    if (!cmsData) {
      cmsData = fetch(CMS_LIST_PATH)
        .then((response) => response.json())
        .then((data) => {
          return fetchCmsData(data.fields, data.cms);
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
      (key) => !["name", "description", "value", "type"].includes(key)
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
async function fetchCmsData(
  fields: string,
  cms: string[]
): Promise<ReceivedCmsData> {
  let promises: Promise<any>[] = [];
  [fields, ...cms].forEach((cms: string) => {
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

  const values = await Promise.all(promises);
  const fieldsData = values[0];
  let rawCms: Cms[] = values.slice(1);
  const parsedCms: { [x_1: string]: Cms } = {};
  for (let i = 0; i < rawCms.length; i++) {
    parsedCms[cms[i]] = parseCms(rawCms[i]);
  }
  rawCms = sortCmsByName(rawCms);
  return { fields: fieldsData, cms: parsedCms };
}

function sortCmsByName(cmsArray: Cms[]) {
  return cmsArray.sort((a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

function parseCms(data: any): Cms {
  // These fields can be provided as a direct value or by a value-object.
  // Normalize them here to a direct value for later access.
  [
    "lastUpdated",
    "name",
    "version",
    "license",
    "inception",
    "category",
  ].forEach((key) => {
    if (data[key] != null && typeof data[key] === "object") {
      data[key] = data[key].value;
    }
  });

  // Parse licenses
  const licenses: License[] = data.license.split("/");
  if (!licensesAreValid(licenses)) {
    console.error(licenses);
    throw new Error(`CMS ${data.name} has invalid or no licenses!`);
  }

  // Parse categories
  const categories: Category[] = (data.category as string)
    .split("/")
    .map((str) => str.trim())
    .filter((str) => (Category as any)[str])
    .sort() as Category[];
  if (!categoriesAreValid(categories)) {
    console.error(categories);
    throw new Error(`CMS ${data.name} has invalid or no categories!`);
  }

  // Parse properties
  const properties: { [x: string]: CmsProperty } = {};
  const propertyKeys: string[] = Object.keys(data.properties);
  for (const key of propertyKeys) {
    const currentProperty: any = data.properties[key];
    if (currentProperty.value != null) {
      const parsedValue = parseValue(currentProperty);
      if (parsedValue != null) {
        properties[key] = parsedValue;
      }
    } else {
      const category: CategoryCmsProperty = {
        type: PropertyType.Category,
        name: currentProperty.name,
        description: currentProperty.description,
      };
      properties[key] = category;
      const subPropertyKeys = CmsService.getKeysOfSubFields(currentProperty);
      for (const subKey of subPropertyKeys) {
        category[subKey] = parseValue(currentProperty[subKey]);
      }
    }
  }

  const cms: Cms = {
    lastUpdated: data.lastUpdated,
    name: data.name,
    version: data.version,
    inception: data.inception,
    systemRequirements: data.systemRequirements,
    specialFeatures: data.specialFeatures,
    license: licenses,
    category: categories,
    properties,
    gitHubURL: data.gitHubURL,
    teaser: data.teaser,
  };

  return cms;
}

const parseValue = (p: any): null | BooleanCmsProperty => {
  const validRe = /^(Yes|No|null)/;
  const infoRe = /^(Yes|No)[,\s*](.*)$/;
  let value: boolean | undefined = undefined;
  let info: string | undefined = undefined;

  if (p == null) {
    console.warn("Provided null as value!");
    return null;
  }

  if (p.value) {
    if (typeof p.value === "boolean" || validRe.test(p.value)) {
      value =
        typeof p.value === "boolean" ? p.value : p.value.startsWith("Yes");
      const match = infoRe.exec(p.value);
      if (match) {
        info = match[2];
      }
    } else {
      console.warn(`Invalid value for ${p.name}: ${p.value}`);
    }
  }
  return { name: p.name, value, info, type: PropertyType.Boolean };
};

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

export default CmsService;
