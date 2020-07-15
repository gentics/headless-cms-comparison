/*enum License {
  GPL,
  BSD,
  Proprietary,
};*/

type FieldType = boolean | string | ArrayType;
// type Test = { name: string, value?: string | boolean};
type ArrayType = { [key: string] : FieldType };
// type SimpleProperty = {name: string, description?: string, value?: FieldType};

// type categoryProperty = {name: string, description?: string, }

export interface Cms {
  timeStamp: Date;
  name: string;
  version: string;
  license: string; // TODO: Create License Enum
  inception: Date;
  properties: {name: string, value?: string}[]; 
  // properties: ArrayType;
};

