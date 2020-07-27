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
    filterPropertySet: FilterPropertySet,
    cms: { [x: string]: Cms }
  ): FilterResult[] => {
    let filterResults: FilterResult[] = [];

    const basicPropKeys = Object.keys(filterPropertySet.basic);
    const specialPropKeys = Object.keys(filterPropertySet.special);

    const cmsKeys = Object.keys(cms);

    for (let cmsKey of cmsKeys) {
      const curCms: any = cms[cmsKey]; // Needs to be any otherwise I cannot access properties of curCms

      let has: FilterPropertySet = { basic: {}, special: {} };
      let hasNot: FilterPropertySet = { basic: {}, special: {} };
      let satisfactory: boolean = true;

      specialPropKeys.forEach((propertyKey: string) => {
        const currentProperty = filterPropertySet.special[propertyKey];
        const requiredValues: any[] = currentProperty.value;
        if (requiredValues.length > 0) {
          if (
            curCms[propertyKey] !== undefined &&
            getArrayIntersection(requiredValues, curCms[propertyKey]).length > 0
          ) {
            has.special[propertyKey] = currentProperty;
          } else {
            hasNot.special[propertyKey] = currentProperty;
            satisfactory = false;
          }
        }
      });

      basicPropKeys.forEach((propertyKey: string) => {
        const currentProperty = filterPropertySet.basic[propertyKey];
        if (isScoreFilterProperty(currentProperty)) {
          if (currentProperty.value !== ScoreValue.DONT_CARE) {
            const [hasProperty, isSatisfactory] = cmsHasProperty(
              currentProperty,
              curCms.properties[propertyKey]
            );
            hasProperty
              ? (has.basic[propertyKey] = currentProperty)
              : (hasNot.basic[propertyKey] = currentProperty);

            if (satisfactory) satisfactory = isSatisfactory;
          }
        } else {
          const curSubPropKeys = getSubPropertyKeys(currentProperty);
          const hasCategoryProperty: CategoryFilterProperty = {
            name: currentProperty.name,
            description: currentProperty.description,
          };
          const hasNotCategoryProperty: CategoryFilterProperty = {
            name: currentProperty.name,
            description: currentProperty.description,
          };

          curSubPropKeys.forEach((subKey: string) => {
            const subProperty: ScoreFilterProperty = currentProperty[subKey];
            if (subProperty.value !== ScoreValue.DONT_CARE) {
              const [hasProperty, isSatisfactory] = cmsHasProperty(
                subProperty,
                curCms.properties[propertyKey][subKey]
              );
              hasProperty
                ? (hasCategoryProperty[propertyKey] = subProperty)
                : (hasNotCategoryProperty[propertyKey] = subProperty);

              if (satisfactory) satisfactory = isSatisfactory;
            }
          });

          if (getSubPropertyKeys(hasCategoryProperty).length > 0)
            has.basic[propertyKey] = hasCategoryProperty;

          if (getSubPropertyKeys(hasNotCategoryProperty).length > 0)
            hasNot.basic[propertyKey] = hasNotCategoryProperty;
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

  getFilteredProperties: (appState: AppState): FilterPropertySet => {
    if (
      !appState.showModifiedOnly &&
      appState.propertyFilterString.length === 0
    ) {
      // No filtering required, return whole propertySet
      return appState.filterProperties;
    }

    const filterProperties: FilterPropertySet = appState.filterProperties;
    const unchangedFilterProperties: FilterPropertySet =
      appState.unchangedFilterProperties;

    let workPropertySet: FilterPropertySet = deepcopy(
      appState.filterProperties
    );

    if (appState.showModifiedOnly) {
      let specialPropertyKeys = Object.keys(workPropertySet.special);

      specialPropertyKeys.forEach((key: string) => {
        const currentProperty = filterProperties.special[key];
        const referenceProperty = unchangedFilterProperties.special[key];
        if (arraysAreEqual(currentProperty.value, referenceProperty.value)) {
          delete workPropertySet.special[key];
        }
      });

      const basicPropertyKeys = Object.keys(filterProperties.basic);

      for (const currentPropertyKey of basicPropertyKeys) {
        const currentProperty = filterProperties.basic[currentPropertyKey];
        if (isScoreFilterProperty(currentProperty)) {
          const referenceProperty = unchangedFilterProperties.basic[
            currentPropertyKey
          ] as ScoreFilterProperty;
          if (currentProperty.value === referenceProperty.value) {
            delete workPropertySet.basic[currentPropertyKey];
          }
        } else {
          const currentSubPropertyKeys = getSubPropertyKeys(currentProperty);

          for (const subKey of currentSubPropertyKeys) {
            const subProperty = (filterProperties.basic[
              currentPropertyKey
            ] as CategoryFilterProperty)[subKey];

            const refProp = (unchangedFilterProperties.basic[
              currentPropertyKey
            ] as CategoryFilterProperty)[subKey];

            if (subProperty.value === refProp.value) {
              delete (workPropertySet.basic[currentPropertyKey] as CategoryFilterProperty)[
                subKey
              ];
            }
          }
          if (getSubPropertyKeys(workPropertySet.basic[currentPropertyKey]).length === 0) {
            delete workPropertySet.basic[currentPropertyKey];
          }
        }
      }
    }

    const propertyFilterString = appState.propertyFilterString;

    if (propertyFilterString.length > 0) {
      const specialPropertyKeys = Object.keys(workPropertySet.special);

      specialPropertyKeys.forEach((key: string) => {
        const property = workPropertySet.special[key];
        if (
          !property.name
            .toUpperCase()
            .includes(propertyFilterString.toUpperCase())
        ) {
          delete workPropertySet.special[key];
        }
      });

      const basicPropertyKeys = Object.keys(workPropertySet.basic);
      for (const currentPropertyKey of basicPropertyKeys) {
        const currentProperty = workPropertySet.basic[currentPropertyKey];
        if (isScoreFilterProperty(currentProperty)) {
          if (
            !currentProperty.name
              .toUpperCase()
              .includes(propertyFilterString.toUpperCase())
          ) {
            delete workPropertySet.basic[currentPropertyKey];
          }
        } else {
          if (
            !currentProperty.name
              .toUpperCase()
              .includes(propertyFilterString.toUpperCase())
          ) {
            // If category itself does not match the search string, filter the subProperties in the category
            workPropertySet.basic[currentPropertyKey] = currentProperty;
            const subPropertyKeys = getSubPropertyKeys(currentProperty)

            for (const currentSubPropertyKey of subPropertyKeys) {
              const currentSubProperty = (currentProperty as CategoryFilterProperty)[currentSubPropertyKey];
              if (
                !currentSubProperty.name
                  .toUpperCase()
                  .includes(propertyFilterString.toUpperCase())
              ) {
                delete (workPropertySet.basic[currentPropertyKey] as CategoryFilterProperty)[
                  currentSubPropertyKey
                ];
              }
            }
            
            if (getSubPropertyKeys(workPropertySet.basic[currentPropertyKey]).length === 0) {
              delete workPropertySet.basic[currentPropertyKey];
            }
          }
        }
      }
    }

    return workPropertySet;
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
  scoreFilterProperty: ScoreFilterProperty,
  cmsProperty: BooleanCmsProperty
): [boolean, boolean] {
  if (cmsProperty && cmsProperty.value) {
    return [true, true];
  } else {
    if (scoreFilterProperty.value === ScoreValue.REQUIRED) {
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

function isScoreFilterProperty(
  x: BasicFilterProperty
): x is ScoreFilterProperty {
  if (!x) return false;
  return x.value !== undefined;
}

function getSubPropertyKeys(prop: CategoryFilterProperty): string[] {
  return Object.keys(prop).filter(
    (key) => key !== "name" && key !== "description"
  );
}

export default FilterService;
