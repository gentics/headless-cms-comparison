/*enum License {
  GPL,
  BSD,
  Proprietary,
};*/

type FieldType = boolean | string;

export interface Cms {
  timestamp: Date;
  name: string;
  version: string;
  license: string; // TODO: Create License Enum
  inception: Date;
  properties: { [key: string] : FieldType };
};