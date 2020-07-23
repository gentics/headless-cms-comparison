import {
  FilterPropertySet,
  Cms,
  FilterResult,
  ScoreValue,
  CategoryFilterProperty,
  ScoreFilterProperty,
  BooleanCmsProperty,
  BasicFilterProperty,
} from "./Cms";
import deepcopy from "ts-deepcopy";

const FilterService = {
  /**
   * Filters the cms acoording to @param formProperties.
   * Returns all cms, satisfactory boolean is set accordingly.
   */
  filterCms: (filterPropSet: FilterPropertySet, cms: Cms[]): FilterResult[] => {
    let filterResults: FilterResult[] = [];

    const basicPropKeys = Object.keys(filterPropSet.basic);
    const specialPropKeys = Object.keys(filterPropSet.special);

    for (let i = 0; i < cms.length; i++) {
      const curCms: any = cms[i];

      let has: FilterPropertySet = { basic: {}, special: {} };
      let hasNot: FilterPropertySet = { basic: {}, special: {} };
      let satisfactory: boolean = true;

      specialPropKeys.forEach((key: string) => {
        const curProp = filterPropSet.special[key];
        const reqValues: any[] = curProp.value;
        if (reqValues.length > 0) {
          if (getArrayIntersection(reqValues, curCms[key]).length > 0) {
            has.special[key] = curProp;
          } else {
            hasNot.special[key] = curProp;
            satisfactory = false;
          }
        } else {
          hasNot.special[key] = curProp;
          satisfactory = false;
        }
      });

      basicPropKeys.forEach((key: string) => {
        const curProp = filterPropSet.basic[key];
        if (isScoreFilterProp(curProp)) {
          if (curProp.value != ScoreValue.DONT_CARE) {
            const [hasProperty, isSatisfactory] = cmsHasProperty(
              curProp,
              curCms.properties[key]
            );
            hasProperty
              ? (has.basic[key] = curProp)
              : (hasNot.basic[key] = curProp);

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
            if (subProp.value != ScoreValue.DONT_CARE) {
              const [hasProperty, isSatisfactory] = cmsHasProperty(
                subProp,
                curCms.properties[key][subKey]
              );
              hasProperty
                ? (hasCategoryProp[key] = subProp)
                : (hasNotCategoryProp[key] = subProp);

              if (satisfactory) satisfactory = isSatisfactory;
            }
          });

          if (getSubPropKeys(hasCategoryProp).length > 0)
            has.basic[key] = hasCategoryProp;

          if (getSubPropKeys(hasNotCategoryProp).length > 0)
            hasNot.basic[key] = hasNotCategoryProp;
        }
      });

      filterResults.push({
        cms: curCms,
        has: has,
        hasNot: hasNot,
        satisfactory: satisfactory,
      });
    }

    console.table(filterResults);
    return filterResults;
  },

  getFilteredProperties: (
    propSet: FilterPropertySet,
    initialPropSet: FilterPropertySet,
    showModifiedOnly: boolean,
    propertyFilterString: string
  ): FilterPropertySet => {
    if (!showModifiedOnly && propertyFilterString.length === 0) {
      // No filtering required, return whole propSet
      return propSet;
    }

    let workPropSet: FilterPropertySet = deepcopy(propSet);

    if (showModifiedOnly) {
      let specialPropKeys = Object.keys(workPropSet.special);

      // Delete all non-modified keys
      specialPropKeys.forEach((key: string) => {
        const curProp = propSet.special[key];
        const refProp = initialPropSet.special[key];
        if (arraysAreEqual(curProp.value, refProp.value)) {
          delete workPropSet.special[key];
        }
      });

      const basicPropKeys = Object.keys(propSet.basic);

      for (const key of basicPropKeys) {
        const curProp = propSet.basic[key];
        if (isScoreFilterProp(curProp)) {
          const refProp = initialPropSet.basic[key] as ScoreFilterProperty;
          if (curProp.value === refProp.value) {
            delete workPropSet.basic[key];
          }
        } else {
          const curSubPropKeys = getSubPropKeys(curProp);

          for (const subKey of curSubPropKeys) {
            const subProp = (propSet.basic[key] as CategoryFilterProperty)[
              subKey
            ];

            const refProp = (initialPropSet.basic[
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
    if (scoreFilterProp.value == ScoreValue.REQUIRED) {
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