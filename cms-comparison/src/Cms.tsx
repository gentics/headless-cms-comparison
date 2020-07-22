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

///////////////////////////////////
// INTERFACES FOR CMS PROPERTIES //
///////////////////////////////////

export interface CmsProperty {
  name: string;
  description?: string;
}

export interface DescriptionCmsProperty extends CmsProperty {
  description: string;
}

export interface BasicCmsProperty extends CmsProperty {
  value: string | boolean; // TODO: Should be only boolean
}

export interface CategoryCmsProperty extends CmsProperty {
  [index: string]: any;
}

////////////////////////////////////
// INTERFACES FOR FORM PROPERTIES //
////////////////////////////////////

export interface FormProperty {
  name: string;
  description: string;
}

// Category form property, has other properties as "children"
export interface CategoryFormProperty extends FormProperty {
  [index: string]: any;
}

// Boolean form property
export interface SimpleFormProperty extends FormProperty {
  value: ScoreValue;
}

// OBSOLETE: Complex form property for properties with arbitrary values
export interface ComplexFormProperty extends FormProperty {
  value: ScoreValue | string | null;
  possibleValues: string[];
}

export interface SpecialFormProperty extends FormProperty {
  value: any[]; // (Category[] | License[]);
  possibleValues: any[];
}

// Tristate boolean for "scoring"
export enum ScoreValue {
  DONT_CARE = "Don't Care",
  NICE_TO_HAVE = "Nice-to-Have",
  REQUIRED = "Required"
}

export interface FilterResult {
  cms: Cms;
  has: { basic: { [x: string]: FormProperty }, special: { [x: string]: FormProperty } };
  hasNot: { basic: { [x: string]: FormProperty }, special: { [x: string]: FormProperty } };
  satisfactory: boolean;
}

export interface FormProperties {
  basic: { [x: string]: FormProperty };
  special: { [x: string]: SpecialFormProperty } ;
}