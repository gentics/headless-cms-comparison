import {
  Cms,
  FilterResult,
  ScoreValue,
  BasicField,
  ScoreField,
  SpecialField,
  Category,
  License,
  FilterFieldSet,
  BooleanCmsProperty,
  CategoryField,
  Field,
  PanelSettings,
} from "./Cms";
import deepcopy from "ts-deepcopy";
import CmsService from "./CmsService";

const FilterService = {
  /**
   * Filters the cms acoording to @param formProperties.
   * Returns all cms, satisfactory boolean is set accordingly.
   */
  filterCms: (
    filterFields: FilterFieldSet,
    cms: { [x: string]: Cms }
  ): FilterResult[] => {
    let filterResults: FilterResult[] = [];

    const specialFieldKeys = Object.keys(filterFields.special);
    const cmsKeys = Object.keys(cms);

    for (let cmsKey of cmsKeys) {
      const currentCms: any = cms[cmsKey];

      let has: FilterFieldSet = { basic: {}, special: {} };
      let hasNot: FilterFieldSet = { basic: {}, special: {} };

      let requiredPropertyCount = 0;
      let hasRequiredPropertyCount = 0;
      let niceToHavePropertyCount = 0;
      let hasNiceToHavePropertyCount = 0;

      let satisfactory: boolean = true;

      for (const fieldKey of specialFieldKeys) {
        const currentField = filterFields.special[fieldKey];
        const currentCmsProperty = currentCms[fieldKey];
        const requiredValues: any[] = currentField.values;
        if (
          currentCms[fieldKey] !== undefined &&
          FilterService.getArrayIntersection(requiredValues, currentCmsProperty)
            .length > 0
        ) {
          has.special[fieldKey] = currentField;
        } else {
          hasNot.special[fieldKey] = currentField;
          satisfactory = false;
        }
      }

      const basicFieldKeys = Object.keys(filterFields.basic);
      for (const fieldKey of basicFieldKeys) {
        const currentField = filterFields.basic[fieldKey];
        const currentCmsProperty = currentCms.properties[fieldKey];

        if (CmsService.isScoreField(currentField)) {
          if (isOfInterest(currentField)) {
            const fieldIsRequired = isRequired(currentField);

            fieldIsRequired
              ? requiredPropertyCount++
              : niceToHavePropertyCount++;

            if (cmsHasProperty(currentCmsProperty as BooleanCmsProperty)) {
              has.basic[fieldKey] = currentField;
              fieldIsRequired
                ? hasRequiredPropertyCount++
                : hasNiceToHavePropertyCount++;
            } else {
              hasNot.basic[fieldKey] = currentField;
              if (fieldIsRequired) satisfactory = false;
            }
          }
        } else {
          const hasCategoryField = {
            name: currentField.name,
            description: currentField.description,
          } as CategoryField;
          const hasNotCategoryField = Object.assign({}, hasCategoryField);

          const subFieldKeys = CmsService.getKeysOfSubFields(currentField);
          for (const subFieldKey of subFieldKeys) {
            const currentSubField = currentField[subFieldKey] as ScoreField;
            const currentCmsSubProperty = currentCmsProperty[
              subFieldKey
            ] as BooleanCmsProperty;
            if (isOfInterest(currentSubField)) {
              const fieldIsRequired = isRequired(currentSubField);
              fieldIsRequired
                ? requiredPropertyCount++
                : niceToHavePropertyCount++;

              if (cmsHasProperty(currentCmsSubProperty)) {
                hasCategoryField[subFieldKey] = currentSubField;
                fieldIsRequired
                  ? hasRequiredPropertyCount++
                  : hasNiceToHavePropertyCount++;
              } else {
                hasNotCategoryField[subFieldKey] = currentSubField;
                if (fieldIsRequired) satisfactory = false;
              }
            }

            if (!categoryFieldIsEmpty(hasCategoryField)) {
              has.basic[fieldKey] = hasCategoryField;
            }

            if (!categoryFieldIsEmpty(hasNotCategoryField)) {
              hasNot.basic[fieldKey] = hasNotCategoryField;
            }
          }
        }
      }

      filterResults.push({
        cmsKey,
        has,
        hasNot,
        hasRequiredShare:
          requiredPropertyCount > 0
            ? hasRequiredPropertyCount / requiredPropertyCount
            : -1,
        hasNiceToHaveShare:
          niceToHavePropertyCount > 0
            ? hasNiceToHavePropertyCount / niceToHavePropertyCount
            : -1,
        satisfactory,
      });
    }

    filterResults = sortFilterResults(filterResults);

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

  getFilteredFilterFields: (
    panelSettings: PanelSettings,
    filterFields: { actual: FilterFieldSet; untouched: FilterFieldSet }
  ): FilterFieldSet => {
    if (
      !panelSettings.showModifiedOnly &&
      panelSettings.fieldFilterString.length === 0
    ) {
      return filterFields.actual;
    }

    const untouchedFields: FilterFieldSet = filterFields.untouched;

    const workFields = deepcopy<FilterFieldSet>(filterFields.actual);

    if (panelSettings.showModifiedOnly) {
      const specialFieldKeys = Object.keys(workFields.special);

      specialFieldKeys.forEach((key: string) => {
        const currentField = workFields.special[key];
        const referenceField = untouchedFields.special[key];
        if (arraysAreEqual(currentField.values, referenceField.values)) {
          delete workFields.special[key];
        }
      });

      const basicFieldKeys = Object.keys(workFields.basic);

      for (const fieldKey of basicFieldKeys) {
        const currentField = workFields.basic[fieldKey];

        if (CmsService.isScoreField(currentField)) {
          const untouchedField = untouchedFields.basic[fieldKey] as ScoreField;
          if (currentField.value === untouchedField.value) {
            delete workFields.basic[fieldKey];
          }
        } else {
          const subFieldKeys = CmsService.getKeysOfSubFields(currentField);
          for (const subFieldKey of subFieldKeys) {
            const currentSubField = (workFields.basic[
              fieldKey
            ] as CategoryField)[subFieldKey];

            const untouchedSubField = (untouchedFields.basic[
              fieldKey
            ] as CategoryField)[subFieldKey];

            if (currentSubField.value === untouchedSubField.value) {
              delete (workFields.basic[fieldKey] as CategoryField)[subFieldKey];
            }
          }
          if (categoryFieldIsEmpty(workFields.basic[fieldKey])) {
            delete workFields.basic[fieldKey];
          }
        }
      }
    }

    const fieldFilterString = panelSettings.fieldFilterString;

    if (fieldFilterString.length > 0) {
      const specialFieldKeys = Object.keys(workFields.special);

      specialFieldKeys.forEach((fieldKey: string) => {
        const currentField = workFields.special[fieldKey];
        if (!fieldNameContainsString(currentField, fieldFilterString)) {
          delete workFields.special[fieldKey];
        }
      });

      const basicFieldKeys = Object.keys(workFields.basic);
      for (const fieldKey of basicFieldKeys) {
        const currentField = workFields.basic[fieldKey];
        if (CmsService.isScoreField(currentField)) {
          if (!fieldNameContainsString(currentField, fieldFilterString)) {
            delete workFields.basic[fieldKey];
          }
        } else {
          if (!fieldNameContainsString(currentField, fieldFilterString)) {
            // If category itself does not match the search string, filter the subProperties in the category
            const subFieldKeys = CmsService.getKeysOfSubFields(currentField);

            for (const subFieldKey of subFieldKeys) {
              const currentSubField = (currentField as CategoryField)[
                subFieldKey
              ];
              if (
                !fieldNameContainsString(currentSubField, fieldFilterString)
              ) {
                delete (workFields.basic[fieldKey] as CategoryField)[
                  subFieldKey
                ];
              }
            }

            if (categoryFieldIsEmpty(workFields.basic[fieldKey])) {
              delete workFields.basic[fieldKey];
            }
          }
        }
      }
    }

    return workFields;
  },

  /**
   * Initializes all non-special FieldProperties to FilterProperties by setting values accordingly
   * @returns an object containing all properties with values set to Score.DONT_CARE
   */
  initializeBasicFields: function (basicFields: {
    [x: string]: BasicField;
  }): { [x: string]: BasicField } {
    const fields: { [x: string]: BasicField } = deepcopy<{
      [x: string]: BasicField;
    }>(basicFields);

    const fieldKeys: string[] = Object.keys(fields);

    for (const key of fieldKeys) {
      const currentField = fields[key];
      if (CmsService.isScoreField(currentField)) {
        currentField.value = ScoreValue.DONT_CARE;
      } else {
        const subPropertyKeys = CmsService.getKeysOfSubFields(currentField);
        for (const subKey of subPropertyKeys) {
          const currentSubField = currentField[subKey] as ScoreField;
          currentSubField.value = ScoreValue.DONT_CARE;
        }
      }
    }
    return fields;
  },

  initializeSpecialFields: function (): { [x: string]: SpecialField } {
    const specialFields: { [x: string]: SpecialField } = {};
    specialFields.category = {
      name: "Allowed Categories",
      description: "Which featureset is offered by the cms?",
      values: Object.values(Category),
      possibleValues: Object.values(Category),
    };

    specialFields.license = {
      name: "Allowed Licenses",
      description: "License of the system.",
      values: Object.values(License),
      possibleValues: Object.values(License),
    };

    return specialFields;
  },

  getArrayIntersection: function (a: string[], b: string[]): string[] {
    return a.filter((value) => b.includes(value));
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

function isOfInterest(scoreField: ScoreField): boolean {
  return (
    scoreField.value === ScoreValue.REQUIRED ||
    scoreField.value === ScoreValue.NICE_TO_HAVE
  );
}

function isRequired(scoreField: ScoreField): boolean {
  return scoreField.value === ScoreValue.REQUIRED;
}

function fieldNameContainsString(field: Field, str: string) {
  return field.name.toUpperCase().includes(str.toUpperCase());
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

function categoryFieldIsEmpty(categoryProperty: CategoryField): boolean {
  return CmsService.getKeysOfSubFields(categoryProperty).length === 0;
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

export default FilterService;
