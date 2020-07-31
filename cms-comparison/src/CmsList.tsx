import * as React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  BasicField,
  ScoreField,
  Cms,
  CmsProperty,
  BooleanCmsProperty,
  CmsData,
} from "./Cms";
import "primereact/resources/themes/nova-light/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function CmsList(props: { cmsData: CmsData }) {
  const cms: any = Object.keys(props.cmsData.cms).map((cmsKey: string) =>
    convertCmsToTableDataStructure(props.cmsData.cms[cmsKey])
  );
  const columns = constructColumnDataStructure(props.cmsData);
  
  return (
    <div>
      <DataTable
        value={cms}
        autoLayout
        scrollable
        scrollHeight="650px"
        className="w-100"
        frozenWidth="200px"
      >
        {columns}
      </DataTable>
    </div>
  );
}

function constructColumnDataStructure(cmsData: CmsData) {
  const basicFields: { [x: string]: BasicField } = cmsData.fields.properties;
  const basicFieldKeys = Object.keys(basicFields);
  const columns: JSX.Element[] = [];

  const specialFields: { [x: string]: any } = cmsData.fields;
  const specialFieldKeys = getSpecialKeys(specialFields);

  columns.push(convertToColumn("name", "CMS-Name", true));

  specialFieldKeys.forEach((key) => {
    columns.push(convertToColumn(key, specialFields[key].name, false));
  });

  for (const currentFieldKey of basicFieldKeys) {
    const currentField = basicFields[currentFieldKey];
    if (isScoreFieldProperty(currentField)) {
      columns.push(convertToColumn(currentFieldKey, currentField.name, false));
    } else {
      const subFieldKeys = getSubPropertyKeys(currentField);
      for (const currentSubPropertyKey of subFieldKeys) {
        const currentSubField = currentField[currentSubPropertyKey];
        columns.push(
          convertToColumn(
            currentSubPropertyKey,
            currentField.name + ": " + currentSubField.name,
            false
          )
        );
      }
    }
  }

  return columns;
}

function isScoreFieldProperty(x: BasicField): x is ScoreField {
  return x && x.value !== undefined;
}

function convertToColumn(
  propertyKey: string,
  propertyDisplayName: string,
  frozen: boolean
) {
  return (
    <Column
      key={propertyKey}
      field={propertyKey}
      header={propertyDisplayName}
      frozen={frozen}
      style={{ width: "220px", height: "150px" }}
      className={frozen ? "cmsTableNameColumn" : undefined}
      sortable
    />
  );
}

function convertCmsToTableDataStructure(cms: Cms) {
  const properties = cms.properties;

  const tableCms: { [x: string]: any } = {};

  const specialProperties: any = cms;
  const specialPropertyKeys = getSpecialKeys(cms);
  specialPropertyKeys.forEach((key) => {
    const specialProperty = specialProperties[key];
    if (specialProperty) {
      if (specialProperty.value !== undefined) {
        tableCms[key] = specialProperty.value
          ? specialProperty.value
          : "Not specified";
      } else {
        tableCms[key] = specialProperty;
      }
    } else {
      tableCms[key] = "Not specified";
    }

    if (typeof tableCms[key] === "object") {
      tableCms[key] = tableCms[key].toString();
    }
  });

  tableCms.name = cms.name;

  const propertyKeys = Object.keys(properties);
  for (const currentKey of propertyKeys) {
    const currentProperty = properties[currentKey];
    if (isBooleanCmsProperty(currentProperty)) {
      tableCms[currentKey] = currentProperty.value ? "Yes" : "No";
    } else {
      const subPropertyKeys = getSubPropertyKeys(currentProperty);
      for (const currentSubKey of subPropertyKeys) {
        const currentSubProperty = currentProperty[currentSubKey];
        tableCms[currentSubKey] = currentSubProperty.value ? "Yes" : "No";
      }
    }
  }

  return tableCms;
}

function isBooleanCmsProperty(x: CmsProperty): x is BooleanCmsProperty {
  return x && x.value !== undefined;
}

function getSubPropertyKeys(property: any): string[] {
  return Object.keys(property).filter(
    (key) => key !== "name" && key !== "description"
  );
}

function getSpecialKeys(indexedArray: any): string[] {
  return Object.keys(indexedArray).filter(
    (key) => key !== "properties" && key !== "name" && key !== "specialFeatures"
  );
}
