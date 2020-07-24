import {
  Cms,
  CmsProperty,
  BooleanCmsProperty,
  Category,
  ScoreValue,
  License,
  FilterPropertySet,
  CategoryFilterProperty,
  FieldProperty,
  ScoreFieldProperty,
  BasicFilterProperty,
  CategoryCmsProperty,
  AppState,
} from "./Cms";
import deepcopy from "ts-deepcopy";
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
  const start = Date.now();
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

  return Promise.all(promises).then((values) => {
    const fields = values[0];
    const rawCms: Cms[] = values.slice(1);
    cmsList = cmsList.sort().filter(x => x.toLowerCase() !== "fields");
    rawCms.sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
    const cms: { [x: string]: Cms } = {};
    for (let i = 0; i < rawCms.length; i++) {
      cms[cmsList[i]] = parseCms(rawCms[i]);
    }
    const filterProperties: FilterPropertySet = { basic: {}, special: {} };
    filterProperties.basic = getBasicFilterProps(fields.properties);

    // Append special properties

    filterProperties.special.category = {
      name: "Allowed Categories",
      description: "Which featureset is offered by the cms?",
      value: Object.values(Category),
      possibleValues: Object.values(Category),
    };

    filterProperties.special.license = {
      name: "Allowed Licenses",
      description: "License of the system.",
      value: Object.values(License),
      possibleValues: Object.values(License),
    };

    const unchangedFilterProperties = deepcopy<FilterPropertySet>(
      filterProperties
    );

    const appState: AppState = {
      fields: fields,
      cms: cms,
      filterProperties: filterProperties,
      unchangedFilterProperties: unchangedFilterProperties,
      showModifiedOnly: false,
      propertyFilterString: "",
      filterResults: FilterService.getUnfilteredCms(cms),
    };

    const elapsed = Date.now() - start;
    console.log(`Fetch took ${elapsed} ms`);
    return appState;
  });
}

/**
 * - Parses licenses and categories from string in array form
 * - Looks at each property of a cms and replaces
 *   Yes's and No's with their corresponding boolean values
 */
function parseCms(cms: any): Cms {
  // Special parsing for licenses and categories
  try {
    // Parse licenses
    const licenses: License[] = cms.license.split("/");
    if (!licenses) throw new Error(`CMS ${cms.name} has no license!`);
    // Check if all given license values match an enum value
    if (
      Object.values(License).filter((value) => licenses.includes(value))
        .length !== licenses.length
    ) {
      throw new Error(`CMS ${cms.name} contains invalid licenses!`);
    }
    cms.license = licenses;
    // Parse categories
    const categories: Category[] = cms.category.split("/");
    if (!categories) throw new Error(`CMS ${cms.name} has no category!`);
    // Check if all given category values match an enum value
    if (
      Object.values(Category).filter((value) => categories.includes(value))
        .length !== categories.length
    ) {
      console.error(categories);
      throw new Error(`CMS ${cms.name} contains invalid categories!`);
    }
    cms.category = categories;
  } catch (e) {
    throw e;
    /*throw Error(
      `An error occured while parsing licenses and categories of cms ${cms.name}! Fields might not exist...`
    );*/
  }

  // Parse properties by replacing boolean words with actual booleans

  const propKeys: string[] = Object.keys(cms.properties);

  propKeys.forEach((propertyKey: string) => {
    const curProp: CmsProperty = cms.properties[propertyKey];
    if (isBooleanCmsProperty(curProp)) {
      curProp.value = curProp.value === "Yes" ? true : false;
      cms.properties[propertyKey] = curProp;
    } else {
      const curSubPropKeys = getSubPropKeys(curProp);
      curSubPropKeys.forEach((subPropKey: string) => {
        const subProp = curProp[subPropKey] as BooleanCmsProperty;
        subProp.value = subProp.value === "Yes" ? true : false;
        cms.properties[propertyKey][subPropKey] = subProp;
      });
    }
  });
  return cms;
}

function isBooleanCmsProperty(x: CmsProperty): x is BooleanCmsProperty {
  if (!x) return false;
  return (x as BooleanCmsProperty).value !== undefined;
}

function getSubPropKeys(prop: CategoryCmsProperty): string[] {
  return Object.keys(prop).filter(
    (key) => key !== "name" && key !== "description"
  );
}

/**
 * Iterates over all fields and collects all possible values from all CMS
 * @returns an object containing all properties with values
 * set to 0 or null, depending on their types
 */
function getBasicFilterProps(fields: {
  [x: string]: FieldProperty;
}): { [index: string]: BasicFilterProperty } {
  const basicFilterProps: { [x: string]: BasicFilterProperty } = {};
  const propKeys: string[] = Object.keys(fields);

  propKeys.forEach((key: string) => {
    const curFieldProp = fields[key];

    if (isScoreFieldProperty(curFieldProp)) {
      // Is score field property
      basicFilterProps[key] = {
        name: curFieldProp.name,
        description: curFieldProp.description,
        value: ScoreValue.DONT_CARE,
      };
    } else {
      // Is category field property
      const subPropKeys = getSubPropKeys(curFieldProp);

      let catFilterProp: CategoryFilterProperty = {
        name: curFieldProp.name,
        description: curFieldProp.description,
      };

      for (let subKey of subPropKeys) {
        const curSubFieldProp = curFieldProp[subKey] as ScoreFieldProperty;

        catFilterProp[subKey] = {
          name: curSubFieldProp.name,
          description: curSubFieldProp.description,
          value: ScoreValue.DONT_CARE,
        };
      }

      basicFilterProps[key] = catFilterProp;
    }
  });
  return basicFilterProps;
}

function isScoreFieldProperty(x: FieldProperty): x is ScoreFieldProperty {
  if (!x) return false;
  return (x as ScoreFieldProperty).value !== undefined;
}

export default CmsService;
