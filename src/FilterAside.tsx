import React from "react";
import { Sidebar } from "primereact/sidebar";
import Form from "react-bootstrap/Form";

import { PanelSettings, FilterFieldSet, CategoryField } from "./Cms";

import FilterService from "./FilterService";
import FilterPropertyTable from "./FilterPropertyTable";

type PropsType = {
  filterFields: { actual: FilterFieldSet; untouched: FilterFieldSet };
  updateFilterFields: (updatedFilterFields: FilterFieldSet) => void;
  showAside: boolean;
  toggleAside: () => void;
};

export const FilterAside = (props: PropsType): JSX.Element => {
  const { filterFields, updateFilterFields, showAside, toggleAside } = props;
  const [panelSettings, setPanelSettings] = React.useState<PanelSettings>({
    showModifiedOnly: false,
    fieldFilterString: "",
  });

  const handlePanelSettingsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.name === "showModifiedOnly") {
      setPanelSettings({
        showModifiedOnly: event.target.checked,
        fieldFilterString: panelSettings.fieldFilterString,
      });
    } else {
      setPanelSettings({
        showModifiedOnly: panelSettings.showModifiedOnly,
        fieldFilterString: event.target.value,
      });
    }
  };

  const handleSpecialFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedFilterFields = Object.assign({}, filterFields.actual);
    const fieldKey = event.target.name;
    const valueArray = updatedFilterFields.special[fieldKey].values;
    const value = event.target.value;

    if (event.target.checked) {
      if (!valueArray.includes(value)) {
        valueArray.push(value);
      }
    } else {
      const valueIndex = valueArray.indexOf(value);
      if (valueIndex !== -1) {
        valueArray.splice(valueIndex, 1);
      }
    }

    updatedFilterFields.special[fieldKey].values = valueArray;

    updateFilterFields(updatedFilterFields);
  };

  const handleBasicFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string,
    categoryKey?: string
  ) => {
    // Clone object, otherwise react won't re-render
    const updatedFilterFields = Object.assign({}, filterFields.actual);

    if (categoryKey) {
      (updatedFilterFields.basic[categoryKey] as CategoryField)[
        fieldKey
      ].value = event.target.value;
    } else {
      updatedFilterFields.basic[fieldKey].value = event.target.value;
    }

    updateFilterFields(updatedFilterFields);
  };

  const filteredFilterFields = FilterService.getFilteredFilterFields(
    panelSettings,
    filterFields
  );

  return (
    <Sidebar
      visible={showAside}
      onHide={() => toggleAside()}
      style={{ width: "30em", overflow: "auto" }}
    >
      <Form>
        {showAside ? (
          <>
            <div>
              <Form.Control
                type="text"
                name="fieldFilterString"
                value={panelSettings.fieldFilterString}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handlePanelSettingsChange(e)
                }
                placeholder="Filter for properties..."
                style={{ width: "300px" }}
              />
            </div>
            <div className="d-flex align-items-center ml-2">
              {" "}
              <Form.Check
                type="checkbox"
                name="showModifiedOnly"
                label="Show modified properties only"
                checked={panelSettings.showModifiedOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handlePanelSettingsChange(e)
                }
              />
            </div>
          </>
        ) : null}
      </Form>
      <FilterPropertyTable
        filterFields={filteredFilterFields}
        specialFieldChangeHandler={handleSpecialFieldChange}
        basicFieldChangeHandler={handleBasicFieldChange}
      />
    </Sidebar>
  );
};

export default FilterAside;
