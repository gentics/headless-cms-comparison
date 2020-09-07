import React from "react";
import ReactGA from "react-ga";
import { Sidebar } from "primereact/sidebar";
import Form from "react-bootstrap/Form";
import { Card } from "primereact/card";
import {
  PanelSettings,
  FilterFieldSet,
  CategoryField,
  ActivePreset,
  SHOW_CUSTOM,
} from "./Cms";

import FilterService from "./FilterService";
import FilterPropertyTable from "./FilterPropertyTable";

type PropsType = {
  filterFields: { current: FilterFieldSet; untouched: FilterFieldSet };
  updateFilterFields: (
    updatedFilterFields: FilterFieldSet,
    preset: ActivePreset
  ) => void;
  showAside: boolean;
  toggleAside: () => void;
  cookiesAccepted: boolean;
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
    const updatedFilterFields = Object.assign({}, filterFields.current);
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

    updateFilterFields(updatedFilterFields, SHOW_CUSTOM);
  };

  const handleBasicFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string,
    categoryKey?: string
  ) => {
    // Clone object, otherwise react won't re-render
    const updatedFilterFields = Object.assign({}, filterFields.current);

    if (categoryKey) {
      (updatedFilterFields.basic[categoryKey] as CategoryField)[
        fieldKey
      ].value = event.target.value;
    } else {
      updatedFilterFields.basic[fieldKey].value = event.target.value;
    }

    if (props.cookiesAccepted) {
      ReactGA.event({
        category: "Filter",
        action: `${categoryKey || ""}/${fieldKey}: ${event.target.value}`,
      });
    }

    updateFilterFields(updatedFilterFields, SHOW_CUSTOM);
  };

  const filteredFilterFields = FilterService.getFilteredFilterFields(
    panelSettings,
    filterFields
  );

  return (
    <Sidebar visible={showAside} onHide={() => toggleAside()}>
      <Form>
        {showAside ? (
          <Card title="Filter for properties" className="mt-5">
            <div className="p-3">
              <Form.Control
                type="text"
                name="fieldFilterString"
                value={panelSettings.fieldFilterString}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handlePanelSettingsChange(e)
                }
              />
            </div>
            <div className="p-3 score-checkboxes">
              {" "}
              <input
                type="checkbox"
                name="showModifiedOnly"
                value={panelSettings.fieldFilterString}
                checked={panelSettings.showModifiedOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handlePanelSettingsChange(e)
                }
                id="showModifiedOnly"
              />
              <label htmlFor="showModifiedOnly">
                Show modified properties only
              </label>
            </div>
          </Card>
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
