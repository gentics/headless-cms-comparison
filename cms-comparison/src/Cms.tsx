export enum License {
  GPLv3 = "GPLv3",
  Proprietary = "Proprietary",
  Apache_2 = "Apache-2.0",
  BSD_3 = "BSD 3-Clause",
  MIT = "MIT",
  Commercial = "Commercial",
  Freemium = "Freemium",
  Other = "Other", // No match fallback value
}

export interface Cms {
  lastUpdated: Date;
  name: string;
  version: string;
  license: License[];
  inception: Date;
  category: { essential: boolean; professional: boolean; enterprise: boolean };
  properties: {
    [x: string]: Property // Category | FieldObject
  };
}

export interface Property {
  name: string;
  description?: string;
}

export interface SimpleProperty extends Property {
  value: string | boolean;
}

export interface CategoryProperty extends Property {
  [index: string]: any;
}

// Boolean form property
interface FormProperty {
  name: string;
  description: string;
  value: boolean | string;
}

// Complex form property
interface ComplexFormProperty extends FormProperty {
  possibleValues: string[];
}