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
  properties: {
    [x: string]: Property // Category | FieldObject
  };
}

///////////////////////////////////
// INTERFACES FOR CMS PROPERTIES //
///////////////////////////////////

export interface Property {
  name: string;
  description?: string;
}

export interface DescriptionProperty extends Property {
  description: string;
}

export interface SimpleProperty extends Property {
  value: string | boolean;
}

export interface CategoryProperty extends Property {
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

// Complex form property for properties with arbitrary values
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
  DONT_CARE = 0,
  NICE_TO_HAVE = 1,
  REQUIRED = 2
}