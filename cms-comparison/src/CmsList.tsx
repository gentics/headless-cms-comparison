import * as React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import CmsService from "./CmsService";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  AppState,
  FieldProperty,
  ScoreFieldProperty,
  Cms,
  CmsProperty,
  BooleanCmsProperty,
} from "./Cms";
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';


export default function CmsList() {
  const [appState, setAppState] = React.useState<any>();
  // Is called once at startup, when fetch is finished state is set to the fetch-results
  React.useEffect(() => {
    CmsService.getCmsData().then((appState: AppState) => {
      setAppState(appState);
    });
  }, []);

  // Show progressBar as long as fetch is not completed, otherwise table
  if (appState) {
    const cms: any = Object.keys(appState.cms).map((cmsKey: string) =>
      convertCmsToTableDataStructure(appState.cms[cmsKey])
    );
    const columns = constructColumnDataStructure(appState);
    console.log(cms);
    return (
      <div>
        <DataTable value={cms} autoLayout scrollable scrollHeight="650px" className="w-100" frozenWidth="200px">{columns}</DataTable>
      </div>
    );
  } else {
    return <ProgressBar animated now={100} />;
  }
}

function constructColumnDataStructure(appState: AppState) {
  const properties: { [x: string]: FieldProperty } = appState.fields.properties;
  const propertyKeys = Object.keys(properties);
  const columns: JSX.Element[] = [];

  columns.push(convertToColumn("name", "CMS-Name", true));

  for (const currentPropertyKey of propertyKeys) {
    const currentProperty = properties[currentPropertyKey];
    if (isScoreFieldProperty(currentProperty)) {
      columns.push(
        convertToColumn(currentPropertyKey, currentProperty.name, false)
      );
    } else {
      const subPropertyKeys = getSubPropertyKeys(currentProperty);
      for (const currentSubPropertyKey of subPropertyKeys) {
        const currentSubProperty = currentProperty[currentSubPropertyKey];
        columns.push(
          convertToColumn(
            currentSubPropertyKey,
            currentProperty.name + ": " + currentSubProperty.name,
            false
          )
        );
      }
    }
  }

  return columns;
}

function isScoreFieldProperty(x: FieldProperty): x is ScoreFieldProperty {
  return x && x.value !== undefined;
}

function convertToColumn(
  propertyKey: string,
  propertyDisplayName: string,
  frozen: boolean
) {
  return (
    <Column
      field={propertyKey}
      header={propertyDisplayName}
      frozen={frozen}
      style={{width: "150px", height: "150px"}}
      className={frozen ? "cmsTableName" : undefined}
      sortable
    />
  );
}

function convertCmsToTableDataStructure(cms: Cms) {
  const properties = cms.properties;
  const propertyKeys = Object.keys(properties);
  const tableCms: { [x: string]: any } = {};

  tableCms.name = cms.name;

  for (const currentPropertyKey of propertyKeys) {
    const currentProperty = properties[currentPropertyKey];
    if (isBooleanCmsProperty(currentProperty)) {
      tableCms[currentPropertyKey] = currentProperty.value ? "Yes" : "No";
    } else {
      const subPropertyKeys = getSubPropertyKeys(currentProperty);
      for (const currentSubPropertyKey of subPropertyKeys) {
        const currentSubProperty = currentProperty[currentSubPropertyKey];
        tableCms[currentSubPropertyKey] = currentSubProperty.value
          ? "Yes"
          : "No";
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
