import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { Helmet } from "react-helmet";
import {
  Cms,
  BooleanCmsProperty,
  CmsData,
  PropertyType,
  CategoryField,
  CategoryCmsProperty,
  FilterFieldSet,
} from "./Cms";
import CmsService from "./CmsService";
import {
  BooleanPropertyTemplate,
  NameTemplate,
  BodyTemplate,
  CmsTableData,
  SpecialPropertyTemplate,
  TableRowData,
  sortData,
} from "./TableTemplates";

export default function CmsList(props: {
  cmsData: CmsData;
  filterFields: FilterFieldSet;
}) {
  const data: CmsTableData = Object.keys(props.cmsData).map((cmsKey: string) =>
    convertCmsToTableDataStructure(
      props.cmsData[cmsKey],
      cmsKey,
      props.filterFields
    )
  );

  const columns: JSX.Element[] = constructColumnDataStructure(
    props.filterFields,
    data
  );

  return (
    <section id="list-view">
      <Helmet>
        <title>List</title>
      </Helmet>
      <Container className="pb-5">
        <Card>
          <DataTable
            value={data}
            autoLayout
            scrollable
            scrollHeight="calc(100vh - 500px)"
            className=""
            frozenWidth="140px"
          >
            {columns}
          </DataTable>
        </Card>
      </Container>
    </section>
  );
}

function constructColumnDataStructure(
  filterFields: FilterFieldSet,
  data: CmsTableData
): JSX.Element[] {
  const columns: JSX.Element[] = [
    convertToColumn("name", "CMS-Name", data, {
      frozen: true,
      template: NameTemplate,
    }),
  ];
  const basicFieldKeys = Object.keys(filterFields.basic);
  const specialFieldKeys = Object.keys(filterFields.special);
  specialFieldKeys.forEach((key: string) => {
    columns.push(
      convertToColumn(key, filterFields.special[key].name, data, {
        template: SpecialPropertyTemplate,
      })
    );
  });

  for (const currentFieldKey of basicFieldKeys) {
    const currentField = filterFields.basic[currentFieldKey];
    if (currentField.value !== undefined) {
      columns.push(
        convertToColumn(currentFieldKey, currentField.name, data, {
          template: BooleanPropertyTemplate,
        })
      );
    } else {
      const category: CategoryField = currentField;
      const subFieldKeys = CmsService.getKeysOfSubFields(category);
      for (const currentSubPropertyKey of subFieldKeys) {
        const currentSubField = category[currentSubPropertyKey];
        columns.push(
          convertToColumn(
            currentSubPropertyKey,
            `${currentField.name}: ${currentSubField.name}`,
            data,
            { template: BooleanPropertyTemplate }
          )
        );
      }
    }
  }

  return columns;
}

function convertToColumn(
  propertyKey: string,
  propertyDisplayName: string,
  data: CmsTableData,
  props?: {
    frozen?: boolean;
    template?: BodyTemplate;
  }
): JSX.Element {
  return (
    <Column
      key={propertyKey}
      field={propertyKey}
      header={propertyDisplayName}
      frozen={props && props.frozen}
      // style={{ width: "220px" }}
      body={props && props.template ? props.template : null}
      className={props && props.frozen ? "cmsTableNameColumn" : undefined}
      sortable
      sortFunction={(e) => sortData(data, e)}
    />
  );
}

function convertCmsToTableDataStructure(
  cms: Cms,
  cmsKey: string,
  filterFields: FilterFieldSet
): TableRowData {
  const tableCms: TableRowData = { name: { name: cms.name, info: cmsKey } };

  Object.keys(filterFields.special).forEach((key: string) => {
    const prop = cms[key];
    tableCms[key] = { name: key, info: prop?.toString() };
  });

  Object.keys(filterFields.basic).forEach((key: string) => {
    const prop = cms.properties[key];
    if (!prop) {
      return;
    }

    if (prop.type === PropertyType.Boolean) {
      tableCms[key] = { name: prop.name, value: prop.value };
      return;
    }

    if (prop.type === PropertyType.Category) {
      const category: CategoryCmsProperty = prop;
      const subPropertyKeys = CmsService.getKeysOfSubFields(category);
      if (subPropertyKeys.length === 0) {
        tableCms[key] = category;
      } else {
        for (const currentSubKey of subPropertyKeys) {
          const currentSubProperty: BooleanCmsProperty =
            category[currentSubKey];
          tableCms[currentSubKey] = {
            name: currentSubProperty.name,
            value: currentSubProperty.value,
          };
        }
      }
    }
  });
  return tableCms;
}
