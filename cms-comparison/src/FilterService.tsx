import {
  FilterPropertySet,
  Cms,
  FilterResult,
  ScoreValue,
  CategoryFilterProperty,
  ScoreFilterProperty,
  BooleanCmsProperty,
  BasicFilterProperty,
  AppState,
} from "./Cms";
import deepcopy from "ts-deepcopy";

const FilterService = {
  /**
   * Filters the cms acoording to @param formProperties.
   * Returns all cms, satisfactory boolean is set accordingly.
   */
  filterCms: (
    filterPropSet: FilterPropertySet,
    cms: { [x: string]: Cms }
  ): FilterResult[] => {
    let filterResults: FilterResult[] = [];

    const basicPropKeys = Object.keys(filterPropSet.basic);
    const specialPropKeys = Object.keys(filterPropSet.special);

    const cmsKeys = Object.keys(cms);

    for (let cmsKey of cmsKeys) {
      const curCms: any = cms[cmsKey]; // Needs to be any otherwise I cannot access properties of curCms

      let has: FilterPropertySet = { basic: {}, special: {} };
      let hasNot: FilterPropertySet = { basic: {}, special: {} };
      let satisfactory: boolean = true;

      specialPropKeys.forEach((propertyKey: string) => {
        const curProp = filterPropSet.special[propertyKey];
        const reqValues: any[] = curProp.value;
        if (reqValues.length > 0) {
          if (getArrayIntersection(reqValues, curCms[propertyKey]).length > 0) {
            has.special[propertyKey] = curProp;
          } else {
            hasNot.special[propertyKey] = curProp;
            satisfactory = false;
          }
        } else {
          hasNot.special[propertyKey] = curProp;
          satisfactory = false;
        }
      });

      basicPropKeys.forEach((propertyKey: string) => {
        const curProp = filterPropSet.basic[propertyKey];
        if (isScoreFilterProp(curProp)) {
          if (curProp.value !== ScoreValue.DONT_CARE) {
            const [hasProperty, isSatisfactory] = cmsHasProperty(
              curProp,
              curCms.properties[propertyKey]
            );
            hasProperty
              ? (has.basic[propertyKey] = curProp)
              : (hasNot.basic[propertyKey] = curProp);

            if (satisfactory) satisfactory = isSatisfactory;
          }
        } else {
          const curSubPropKeys = getSubPropKeys(curProp);
          const hasCategoryProp: CategoryFilterProperty = {
            name: curProp.name,
            description: curProp.description,
          };
          const hasNotCategoryProp: CategoryFilterProperty = {
            name: curProp.name,
            description: curProp.description,
          };

          curSubPropKeys.forEach((subKey: string) => {
            const subProp: ScoreFilterProperty = curProp[subKey];
            if (subProp.value !== ScoreValue.DONT_CARE) {
              const [hasProperty, isSatisfactory] = cmsHasProperty(
                subProp,
                curCms.properties[propertyKey][subKey]
              );
              hasProperty
                ? (hasCategoryProp[propertyKey] = subProp)
                : (hasNotCategoryProp[propertyKey] = subProp);

              if (satisfactory) satisfactory = isSatisfactory;
            }
          });

          if (getSubPropKeys(hasCategoryProp).length > 0)
            has.basic[propertyKey] = hasCategoryProp;

          if (getSubPropKeys(hasNotCategoryProp).length > 0)
            hasNot.basic[propertyKey] = hasNotCategoryProp;
        }
      });

      filterResults.push({
        cmsKey: cmsKey,
        has: has,
        hasNot: hasNot,
        satisfactory: satisfactory,
      });
    }

    console.table(filterResults);
    return filterResults;
  },

  getUnfilteredCms: (cms: { [x: string]: Cms }) => {
    const cmsKeys = Object.keys(cms);
    return cmsKeys.map((cmsKey) => {
      return {
        cmsKey: cmsKey,
        has: { basic: {}, special: {} },
        hasNot: { basic: {}, special: {} },
        satisfactory: true,
      };
    });
  },

  getFilteredProperties: (cmsData: AppState): FilterPropertySet => {
    // TODO: Refactor "props" -> misleading names
    if (
      !cmsData.showModifiedOnly &&
      cmsData.propertyFilterString.length === 0
    ) {
      // No filtering required, return whole propertySet
      return cmsData.filterProperties;
    }

    const filterProperties: FilterPropertySet = cmsData.filterProperties;
    const unchangedFilterProperties: FilterPropertySet =
      cmsData.unchangedFilterProperties;

    let workPropSet: FilterPropertySet = deepcopy(cmsData.filterProperties);

    if (cmsData.showModifiedOnly) {
      let specialPropKeys = Object.keys(workPropSet.special);

      // Delete all non-modified keys
      specialPropKeys.forEach((key: string) => {
        const curProp = filterProperties.special[key];
        const refProp = unchangedFilterProperties.special[key];
        if (arraysAreEqual(curProp.value, refProp.value)) {
          delete workPropSet.special[key];
        }
      });

      const basicPropKeys = Object.keys(filterProperties.basic);

      for (const key of basicPropKeys) {
        const curProp = filterProperties.basic[key];
        if (isScoreFilterProp(curProp)) {
          const refProp = unchangedFilterProperties.basic[
            key
          ] as ScoreFilterProperty;
          if (curProp.value === refProp.value) {
            delete workPropSet.basic[key];
          }
        } else {
          const curSubPropKeys = getSubPropKeys(curProp);

          for (const subKey of curSubPropKeys) {
            const subProp = (filterProperties.basic[
              key
            ] as CategoryFilterProperty)[subKey];

            const refProp = (unchangedFilterProperties.basic[
              key
            ] as CategoryFilterProperty)[subKey];

            if (subProp.value === refProp.value) {
              delete (workPropSet.basic[key] as CategoryFilterProperty)[subKey];
            }
          }
          if (getSubPropKeys(workPropSet.basic[key]).length === 0) {
            delete workPropSet.basic[key];
          }
        }
      }
    }

    const propertyFilterString = cmsData.propertyFilterString;

    if (propertyFilterString.length > 0) {
      const specialPropKeys = Object.keys(workPropSet.special);

      specialPropKeys.forEach((key: string) => {
        const property = workPropSet.special[key];
        if (
          !property.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {
          delete workPropSet.special[key];
        }
      });

      const basicPropKeys = Object.keys(workPropSet.basic);
      basicPropKeys.forEach((key: string) => {
        const prop = workPropSet.basic[key];
        if (isScoreFilterProp(prop)) {
          if (
            !prop.name
              .toUpperCase()
              .includes(propertyFilterString.toUpperCase())
          ) {
            delete workPropSet.basic[key];
          }
        } else {
          if (
            !prop.name
              .toUpperCase()
              .includes(propertyFilterString.toUpperCase())
          ) {
            // If category itself does not match the search string, filter the subProps
            workPropSet.basic[key] = prop;
            const subPropKeys = getSubPropKeys(prop);
            subPropKeys.forEach((subKey) => {
              const subProp = (prop as CategoryFilterProperty)[subKey];
              if (
                !subProp.name
                  .toUpperCase()
                  .includes(propertyFilterString.toUpperCase())
              ) {
                delete (workPropSet.basic[key] as CategoryFilterProperty)[
                  subKey
                ];
              }
            });
            if (getSubPropKeys(workPropSet.basic[key]).length === 0) {
              delete workPropSet.basic[key];
            }
          }
        }
      });
    }
    return workPropSet;
  },
};

/**
 * Checks if a CMS has a certain property.
 * If the property is not available, it is additionally
 * checked wether this property was tagged as REQUIRED,
 * if so the satisfactory boolean is set to false.
 * @returns [hasProperty, isSatisfactory]
 */
function cmsHasProperty(
  scoreFilterProp: ScoreFilterProperty,
  cmsProperty: BooleanCmsProperty
): [boolean, boolean] {
  if (cmsProperty && cmsProperty.value) {
    return [true, true];
  } else {
    if (scoreFilterProp.value === ScoreValue.REQUIRED) {
      return [false, false];
    }
    return [false, true];
  }
}

function getArrayIntersection(a: string[], b: string[]): string[] {
  return a.filter((value) => b.includes(value));
}

function arraysAreEqual(a: any[], b: any[]): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function isScoreFilterProp(x: BasicFilterProperty): x is ScoreFilterProperty {
  if (!x) return false;
  return x.value !== undefined;
}

function getSubPropKeys(prop: CategoryFilterProperty): string[] {
  return Object.keys(prop).filter(
    (key) => key !== "name" && key !== "description"
  );
}

export default FilterService;
