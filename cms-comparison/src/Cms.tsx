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

export interface AppState {
  fields: any, // TODO: Type
  cms: { [x: string]: Cms },
  filterProperties: FilterPropertySet,
  unchangedFilterProperties: FilterPropertySet
  showModifiedOnly: boolean,
  propertyFilterString: string,
  filterResults: FilterResult[],
}

// Tristate boolean for "scoring"
export enum ScoreValue {
  DONT_CARE = "Don't Care",
  NICE_TO_HAVE = "Nice-to-Have",
  REQUIRED = "Required"
}

export interface FilterResult {
  cmsKey: string;
  has: FilterPropertySet;
  hasNot: FilterPropertySet;
  satisfactory: boolean;
}

//////////////
// PROPERTY //
//////////////

export interface Property {
  name: string
}

export type FieldProperty = ScoreFieldProperty | CategoryFieldProperty;

export interface ScoreFieldProperty extends Property {
  description: string,
  value: null
}

export interface CategoryFieldProperty extends Property {
  description: string;
  [index: string]: any; // Contains only ScoreFieldProperties
}

///////////////////////
// FILTER PROPERTIES //
///////////////////////

export type FilterProperty = BasicFilterProperty | SpecialFilterProperty;

export type BasicFilterProperty = ScoreFilterProperty | CategoryFilterProperty;

export interface ScoreFilterProperty extends Property {
  description: string
  value: ScoreValue
}

export interface CategoryFilterProperty extends Property {
  description: string
  [index: string]: any; // Contains only BasicFilterProperties
}

export interface SpecialFilterProperty extends Property {
  description: string
  value: any[];
  possibleValues: any[];
}

export interface FilterPropertySet {
  basic: { [x: string]: BasicFilterProperty }; // Can contain Category or Basic
  special: { [x: string]: SpecialFilterProperty };
}

////////////////////
// CMS PROPERTIES //
////////////////////

export type CmsProperty = BooleanCmsProperty | CategoryCmsProperty;

export interface BooleanCmsProperty extends Property {
  description?: string;
  value: boolean | string;
}

export interface CategoryCmsProperty extends Property {
  description?: string;
  [index: string]: any; // Contains only BasicCmsProperties
}
