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
  CmsProperty,
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

    const basicPropertyKeys = Object.keys(filterPropertySet.basic);
    const specialPropertyKeys = Object.keys(filterPropertySet.special);

    const cmsKeys = Object.keys(cms);

    for (let cmsKey of cmsKeys) {
      const curCms: any = cms[cmsKey]; // Needs to be any otherwise I cannot access properties of curCms

      let has: FilterPropertySet = { basic: {}, special: {} };

      let requiredPropertyCount = 0;
      let hasRequiredPropertyCount = 0;
      let niceToHavePropertyCount = 0;
      let hasNiceToHavePropertyCount = 0;

      let hasNot: FilterPropertySet = { basic: {}, special: {} };
      let satisfactory: boolean = true;

      specialPropertyKeys.forEach((propertyKey: string) => {
        const currentProperty = filterPropertySet.special[propertyKey];
        const requiredValues: any[] = currentProperty.value;
        if (
          curCms[propertyKey] !== undefined &&
          getArrayIntersection(requiredValues, curCms[propertyKey]).length > 0
        ) {
          // hasRequiredPropertyCount++;
          has.special[propertyKey] = currentProperty;
        } else {
          hasNot.special[propertyKey] = currentProperty;
          satisfactory = false;
        }
      });

      basicPropertyKeys.forEach((propertyKey: string) => {
        const currentFilterProperty = filterPropertySet.basic[propertyKey];
        const currentCmsProperty: CmsProperty = curCms.properties[propertyKey];

        if (isScoreFilterProperty(currentFilterProperty)) {
          if (currentFilterProperty.value !== ScoreValue.DONT_CARE) {
            const isRequiredProperty =
              currentFilterProperty.value === ScoreValue.REQUIRED;

            isRequiredProperty
              ? requiredPropertyCount++
              : niceToHavePropertyCount++;

            const hasProperty = cmsHasProperty(
              currentCmsProperty as BooleanCmsProperty
            );

            if (hasProperty) {
              has.basic[propertyKey] = currentFilterProperty;
              isRequiredProperty
                ? hasRequiredPropertyCount++
                : hasNiceToHavePropertyCount++;
            } else {
              hasNot.basic[propertyKey] = currentFilterProperty;
              if (isRequiredProperty) satisfactory = false;
            }
          }
        } else {
          const currentSubPropertyKeys = getSubPropertyKeys(
            currentFilterProperty
          );

          const hasCategoryProperty: CategoryFilterProperty = {
            name: currentFilterProperty.name,
            description: currentFilterProperty.description,
          };
          const hasNotCategoryProperty: CategoryFilterProperty = {
            name: currentFilterProperty.name,
            description: currentFilterProperty.description,
          };

          currentSubPropertyKeys.forEach((subPropertyKey: string) => {
            const currentSubFilterProperty: ScoreFilterProperty =
              currentFilterProperty[subPropertyKey];
            const currentSubCmsProperty: CmsProperty =
              curCms.properties[propertyKey][subPropertyKey];
            if (currentSubFilterProperty.value !== ScoreValue.DONT_CARE) {
              const isRequiredProperty =
                currentSubFilterProperty.value === ScoreValue.REQUIRED;

              isRequiredProperty
                ? requiredPropertyCount++
                : niceToHavePropertyCount++;

              const hasProperty = cmsHasProperty(
                currentSubCmsProperty as BooleanCmsProperty
              );

              if (hasProperty) {
                hasCategoryProperty[subPropertyKey] = currentSubFilterProperty;
                isRequiredProperty
                  ? hasRequiredPropertyCount++
                  : hasNiceToHavePropertyCount++;
              } else {
                hasNotCategoryProperty[subPropertyKey] = currentSubFilterProperty;
                if (isRequiredProperty) satisfactory = false;
              }
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
        hasRequiredShare:
          requiredPropertyCount > 0
            ? hasRequiredPropertyCount / requiredPropertyCount
            : -1,
        hasNiceToHaveShare: niceToHavePropertyCount
          ? hasNiceToHavePropertyCount / niceToHavePropertyCount
          : -1,
        hasNot: hasNot,
        satisfactory: satisfactory,
      });
    }

    filterResults = sortFilterResults(filterResults);

    console.table(filterResults);
    return filterResults;
  },

  getUnfilteredCms: (cms: { [x: string]: Cms }): FilterResult[] => {
    const cmsKeys = Object.keys(cms);
    return cmsKeys.map((cmsKey) => {
      return {
        cmsKey: cmsKey,
        has: { basic: {}, special: {} },
        hasRequiredShare: -1,
        hasNiceToHaveShare: -1,
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
              delete (workPropertySet.basic[
                currentPropertyKey
              ] as CategoryFilterProperty)[subKey];
            }
          }
          if (
            getSubPropertyKeys(workPropertySet.basic[currentPropertyKey])
              .length === 0
          ) {
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
            const subPropertyKeys = getSubPropertyKeys(currentProperty);

            for (const currentSubPropertyKey of subPropertyKeys) {
              const currentSubProperty = (currentProperty as CategoryFilterProperty)[
                currentSubPropertyKey
              ];
              if (
                !currentSubProperty.name
                  .toUpperCase()
                  .includes(propertyFilterString.toUpperCase())
              ) {
                delete (workPropertySet.basic[
                  currentPropertyKey
                ] as CategoryFilterProperty)[currentSubPropertyKey];
              }
            }

            if (
              getSubPropertyKeys(workPropertySet.basic[currentPropertyKey])
                .length === 0
            ) {
              delete workPropertySet.basic[currentPropertyKey];
            }
          }
        }
      }
    }

    return workPropertySet;
  },
};

function sortFilterResults(filterResults: FilterResult[]): FilterResult[] {
  filterResults.sort(function (x: FilterResult, y: FilterResult) {
    if (x.satisfactory !== y.satisfactory) {
      if (x.satisfactory) {
        return -1;
      } else {
        return 1;
      }
    }
    if (x.hasRequiredShare < y.hasRequiredShare) return 1;
    if (x.hasRequiredShare > y.hasRequiredShare) return -1;
    if (x.satisfactory && y.satisfactory) {
      if (x.hasNiceToHaveShare < y.hasNiceToHaveShare) return 1;
      if (x.hasNiceToHaveShare > y.hasNiceToHaveShare) return -1;
    }
    if (x.cmsKey > y.cmsKey) return 1;
    if (x.cmsKey < y.cmsKey) return -1;
    return 0;
  });
  return filterResults;
}

/**
 * Checks if a CMS has a certain property
 */
function cmsHasProperty(cmsProperty: BooleanCmsProperty): boolean {
  if (cmsProperty && cmsProperty.value) {
    if (typeof cmsProperty.value === "boolean") {
      return cmsProperty.value;
    }
    return true;
  } else {
    return false;
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
