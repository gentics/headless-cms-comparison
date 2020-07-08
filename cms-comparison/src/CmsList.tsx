import * as React from 'react';
import { render } from '@testing-library/react';
import ProgressBar from 'react-bootstrap/ProgressBar'
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import CmsService from './CmsService';
import DataGrid, {
  Column,
  Grouping,
  Paging,
  SearchPanel,
  Scrolling,
  Sorting,
  FilterRow
} from 'devextreme-react/data-grid';

export default function CmsList() {
  const [cmsData, setCmsData] = React.useState<any>();
  // Is called once at startup, when fetch is finished state is set to the fetch-results
  React.useEffect(() => {
    CmsService.getCmsData().then(setCmsData);
  }, []);
  
  // Show progressBar as long as fetch is not completed, otherwise table
  if (cmsData) {
    const cols = constructColumns(cmsData.fields);
    return (
      <div>
         <DataGrid
          dataSource={cmsData.cms}
          showBorders={true}
          columnAutoWidth={true}
          hoverStateEnabled={true}
          selection={{ mode: 'single' }}
          height={800}
        >
          <FilterRow visible={true} />
          <Sorting mode="multiple" />
          <SearchPanel visible={true} highlightCaseSensitive={true} />
          <Grouping autoExpandAll={false} />
          <Scrolling mode="standard" />
          <Paging enabled={false} />
          {cols}
        </DataGrid>
      </div>
    );
  } else {
    return (
      <ProgressBar animated now={100} />
    );
  }
}

/**
 * Constructs the columns for the DataTable by categorizing certain properties
 * @param fields represents the available property fields in the table
 * @returns an array containing the columns
 */
function constructColumns(fields: Array<any>): Array<any> {
  let cols: any[] = [];
  let categoryCols: any[] = [];
  let activeCategory = "";

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const fieldCategory = field.name.split('(')[0];
    const fieldHasCategory = fieldCategory.length < field.name.length;
    

    if (fieldHasCategory) {
      if (activeCategory.length > 0) {
        if (fieldCategory === activeCategory) {
          categoryCols.push(<Column key={field.name} dataField={field.name} dataType="string" />);
        } else {
          cols.push(<Column key={activeCategory} caption={activeCategory}>{categoryCols}</Column>);
          categoryCols = [];
          categoryCols.push(<Column key={field.name} dataField={field.name} dataType="string" />);
          activeCategory = fieldCategory;
        }
      } else {
        // assert (categoryCols.length === 0);
        categoryCols.push(<Column key={field.name} dataField={field.name} dataType="string" />);
        activeCategory = fieldCategory;
      }
    } else {
      if (activeCategory.length > 0) {
        cols.push(<Column key={activeCategory} caption={activeCategory}>{categoryCols}</Column>);
        categoryCols = [];
        activeCategory = "";
      }
      cols.push(<Column key={field.name} dataField={field.name} dataType="string" 
      width={field.name === "Name" ? 200 : "auto"} 
      fixed={field.name === "Name" ? true : false }/>);
    }
  }
  return cols;
}