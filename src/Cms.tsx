///////////
// ENUMS //
///////////

export enum License {
  GPLv3 = "GPLv3",
  Proprietary = "Proprietary",
  Apache_2 = "Apache-2.0",
  BSD_3 = "BSD 3-Clause",
  MIT = "MIT",
  Commercial = "Commercial",
  Freemium = "Freemium",
  Other = "Other", // No-match fallback value
}

export enum Category {
  Essential = "Essential",
  Professional = "Professional",
  Enterprise = "Enterprise"
}

// Tristate boolean for "scoring"
export enum ScoreValue {
  DONT_CARE = "Don't Care",
  NICE_TO_HAVE = "Nice-to-Have",
  REQUIRED = "Required"
}

/////////////////////
// CORE INTERFACES //
/////////////////////

export interface AppState {
  cmsData: CmsData,
  filterFields: { actual: FilterFieldSet, untouched: FilterFieldSet },
  filterResults: FilterResult[],
}

export interface CmsData {
  fields: { [x: string]: any }
  cms: { [x: string]: Cms }
}

export interface PanelSettings {
  showModifiedOnly: boolean,
  fieldFilterString: string
}

export interface Cms {
  lastUpdated: Date;
  name: string;
  version: string;
  license: License[];
  inception: Date;
  category: Category[];
  systemRequirements: string | null;
  specialFeatures: string | null;
  properties: {
    [x: string]: CmsProperty // Category | FieldObject
  };
}

export interface FilterResult {
  cmsKey: string;
  has: FilterFieldSet;
  hasNot: FilterFieldSet;
  hasRequiredShare: number,
  hasNiceToHaveShare: number,
  satisfactory: boolean;
}

////////////
// FIELDS //
////////////

export interface Field {
  name: string
}

export type BasicField = ScoreField | CategoryField;

export interface ScoreField extends Field {
  description: string,
  value: null | ScoreValue
}

export interface CategoryField extends Field {
  description: string;
  [index: string]: any; // Contains only ScoreFields
}

export interface SpecialField extends Field {
  description: string
  values: any[];
  possibleValues: any[];
}

export interface FilterFieldSet {
  basic: { [x: string]: BasicField };
  special: { [x: string]: SpecialField };
}

////////////////////
// CMS PROPERTIES //
////////////////////

export type CmsProperty = BooleanCmsProperty | CategoryCmsProperty;

export interface BooleanCmsProperty extends Field {
  description?: string;
  value: boolean | string;
}

export interface CategoryCmsProperty extends Field {
  description?: string;
  [index: string]: any; // Contains only BooleanCmsProperties
}

