import React from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import { Sidebar } from "primereact/sidebar";
import Form from "react-bootstrap/Form";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import {
  ScoreValue,
  PanelSettings,
  FilterFieldSet,
  SpecialField,
  ScoreField,
  CategoryField,
  FilterPreset,
} from "./Cms";

import CmsService from "./CmsService";
import FilterService from "./FilterService";
import Description from "./Description";

type PropsType = {
  filterFields: { actual: FilterFieldSet; untouched: FilterFieldSet };
  updateFilterFields: (updatedFilterFields: FilterFieldSet) => void;
  showAside: boolean;
  toggleAside: () => void;
};

export const FilterAside = (props: PropsType): JSX.Element => {
  const [panelSettings, setPanelSettings] = React.useState<PanelSettings>({
    showModifiedOnly: false,
    fieldFilterString: "",
  });

  const resetPanel = () => {
    setPanelSettings({ showModifiedOnly: false, fieldFilterString: "" });
    props.updateFilterFields(props.filterFields.untouched);
  };

  const resetToPreset = (preset: FilterPreset): void => {
    const newFilter = FilterService.getPresetFilterFields(
      props.filterFields.untouched,
      preset
    );
    props.updateFilterFields(newFilter);
  };

  const handlePanelSettingsChange = (event: any) => {
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

  const handleSpecialFieldChange = (event: any) => {
    const updatedFilterFields = Object.assign({}, props.filterFields.actual);
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

    props.updateFilterFields(updatedFilterFields);
  };

  const handleBasicFieldChange = (
    event: any,
    fieldKey: string,
    categoryKey?: string
  ) => {
    // Clone object, otherwise react won't re-render
    const updatedFilterFields = Object.assign({}, props.filterFields.actual);

    if (categoryKey) {
      (updatedFilterFields.basic[categoryKey] as CategoryField)[
        fieldKey
      ].value = event.target.value;
    } else {
      updatedFilterFields.basic[fieldKey].value = event.target.value;
    }

    props.updateFilterFields(updatedFilterFields);
  };

  const filteredFilterFields = FilterService.getFilteredFilterFields(
    panelSettings,
    props.filterFields
  );

  return (
    <Panel
      filterFields={filteredFilterFields}
      panelSettings={panelSettings}
      panelSettingsChangeHandler={handlePanelSettingsChange}
      specialFieldChangeHandler={handleSpecialFieldChange}
      basicFieldChangeHandler={handleBasicFieldChange}
      resetPanel={resetPanel}
      resetToPreset={resetToPreset}
      showAside={props.showAside}
      toggleAside={props.toggleAside}
    />
  );
};

///////////////////////////////////////////////////////
////////////// METHODS FOR HTML-ELEMENTS //////////////
///////////////////////////////////////////////////////

function Panel(props: {
  filterFields: FilterFieldSet;
  panelSettings: PanelSettings;
  panelSettingsChangeHandler: (event: any) => void;
  specialFieldChangeHandler: (event: any) => void;
  basicFieldChangeHandler: (
    event: any,
    fieldKey: string,
    categoryKey?: string
  ) => void;
  resetPanel: () => void;
  resetToPreset: (preset: FilterPreset) => void;
  showAside: boolean;
  toggleAside: () => void;
}) {
  const {
    panelSettings,
    panelSettingsChangeHandler,
    resetPanel,
    resetToPreset,
    showAside,
    toggleAside,
    ...other
  } = props;

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
                onChange={(e: any) => panelSettingsChangeHandler(e)}
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
                onChange={(e: any) => panelSettingsChangeHandler(e)}
              />
            </div>
          </>
        ) : null}
      </Form>
      <PropertyTable {...other} />
    </Sidebar>
  );
}

function PropertyTable(props: {
  filterFields: FilterFieldSet;
  specialFieldChangeHandler: (event: any) => void;
  basicFieldChangeHandler: (
    event: any,
    fieldKey: string,
    categoryKey?: string
  ) => void;
}) {
  let tableRows: JSX.Element[] = [];
  const {
    filterFields,
    specialFieldChangeHandler,
    basicFieldChangeHandler,
  } = props;

  const specialFieldKeys = Object.keys(filterFields.special);
  for (let fieldKey of specialFieldKeys) {
    const currentField = props.filterFields.special[fieldKey];
    tableRows.push(
      <CheckboxRow
        key={fieldKey}
        specialField={currentField}
        fieldKey={fieldKey}
        changeHandler={specialFieldChangeHandler}
      />
    );
  }

  const basicFieldKeys = Object.keys(filterFields.basic);
  for (let fieldKey of basicFieldKeys) {
    const currentField = filterFields.basic[fieldKey];

    if (CmsService.isScoreField(currentField)) {
      tableRows.push(
        <ScoreRow
          key={fieldKey}
          scoreField={currentField}
          fieldKey={fieldKey}
          changeHandler={basicFieldChangeHandler}
        />
      );
    } else {
      tableRows.push(
        <CategoryRow
          key={fieldKey}
          title={currentField.name}
          description={currentField.description}
        />
      );

      const subFieldKeys = CmsService.getKeysOfSubFields(currentField);

      for (const subKey of subFieldKeys) {
        const currentField = (filterFields.basic[fieldKey] as CategoryField)[
          subKey
        ];
        tableRows.push(
          <ScoreRow
            key={`${fieldKey}_${subKey}`}
            scoreField={currentField}
            fieldKey={subKey}
            changeHandler={basicFieldChangeHandler}
            categoryKey={fieldKey}
          />
        );
      }
    }
  }

  if (tableRows.length === 0) {
    tableRows.push(<NoResultsRow key="no" />);
  }

  return (
    <div style={{ maxHeight: "100%", overflow: "yes" }}>
      <form id="filterForm">
        <table>
          <tbody>{tableRows}</tbody>
        </table>
      </form>
    </div>
  );
}

function CheckboxRow(props: {
  specialField: SpecialField;
  changeHandler: (e: any) => void;
  fieldKey: string;
}): JSX.Element {
  let checkboxes: JSX.Element[] = [];
  for (const possibleValue of props.specialField.possibleValues) {
    checkboxes.push(
      <Checkbox
        key={`${props.fieldKey}_${possibleValue}`}
        fieldKey={props.fieldKey}
        value={possibleValue}
        checked={props.specialField.values.includes(possibleValue)}
        changeHandler={props.changeHandler}
      />
    );
  }

  return (
    <tr>
      <td>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <Description description={props.specialField.description} />
          </span>
          <span className="mr-2">{props.specialField.name}</span>
        </div>
      </td>
      <td>{checkboxes}</td>
    </tr>
  );
}

function Checkbox(props: {
  fieldKey: string;
  value: string;
  checked: boolean;
  changeHandler: (e: any) => void;
}) {
  return (
    <label style={{ paddingRight: "2px" }}>
      <input
        type="checkbox"
        name={props.fieldKey}
        value={props.value}
        checked={props.checked}
        onChange={props.changeHandler}
      />{" "}
      {props.value}
    </label>
  );
}

function CategoryRow(props: { title: string; description: string }) {
  return (
    <tr>
      <td colSpan={2}>
        <div className="d-flex justify-content-between">
          <span className="ml-2">
            <Description description={props.description} />
          </span>
          <span className="mr-2">
            <h4>{props.title}</h4>
          </span>
        </div>
      </td>
    </tr>
  );
}

function ScoreRow(props: {
  scoreField: ScoreField;
  changeHandler: (event: any, fieldKey: string, categoryKey?: string) => void;
  fieldKey: string;
  categoryKey?: string;
}): JSX.Element {
  let style: any = {};
  if (props.categoryKey) {
    style = { fontStyle: "italic", fontWeight: 800 };
  }

  let options: JSX.Element[] = [];

  let i = 0;
  for (const scoreValue of Object.values(ScoreValue)) {
    options.push(
      <option
        key={
          props.categoryKey
            ? `${props.categoryKey}_${props.fieldKey}_${scoreValue}`
            : `${props.fieldKey}_${scoreValue}`
        }
        value={scoreValue}
      >
        {scoreValue}
      </option>
    );
    i++;
  }

  return (
    <tr>
      <td>
        <div className="">
          <span className="ml-2">
            <Description description={props.scoreField.description} />
          </span>
          <span className="mr-2" style={style}>
            {props.scoreField.name}
          </span>
        </div>
      </td>
      <td style={{ textAlign: "right" }}>
        <div className="switch-toggle">
          <input
            id={props.categoryKey + "_" + props.fieldKey + "_1"}
            name={props.categoryKey + "_" + props.fieldKey}
            value={ScoreValue.NICE_TO_HAVE}
            onChange={(e: any) =>
              props.changeHandler(e, props.fieldKey, props.categoryKey)
            }
            type="radio"
          />
          <OverlayTrigger
            placement="top"
            delay={{ show: 250, hide: 400 }}
            overlay={
              <Tooltip id={props.categoryKey + "_" + props.fieldKey + "_1"}>
                Nice to have option
              </Tooltip>
            }
          >
            <label htmlFor={props.categoryKey + "_" + props.fieldKey + "_1"}>
              <i className="fas fa-dice" aria-hidden="true"></i>
            </label>
          </OverlayTrigger>

          <input
            id={props.categoryKey + "_" + props.fieldKey + "_2"}
            name={props.categoryKey + "_" + props.fieldKey}
            value={ScoreValue.DONT_CARE}
            onChange={(e: any) =>
              props.changeHandler(e, props.fieldKey, props.categoryKey)
            }
            type="radio"
            checked={true}
          />

          <OverlayTrigger
            placement="top"
            delay={{ show: 250, hide: 400 }}
            overlay={
              <Tooltip id={props.categoryKey + "_" + props.fieldKey + "_2"}>
                I don't care about this option
              </Tooltip>
            }
          >
            <label htmlFor={props.categoryKey + "_" + props.fieldKey + "_2"}>
              <i className="fa fa-smile" aria-hidden="true"></i>
            </label>
          </OverlayTrigger>

          <input
            id={props.categoryKey + "_" + props.fieldKey + "_3"}
            name={props.categoryKey + "_" + props.fieldKey}
            value={ScoreValue.REQUIRED}
            onChange={(e: any) =>
              props.changeHandler(e, props.fieldKey, props.categoryKey)
            }
            type="radio"
          />
          <OverlayTrigger
            placement="top"
            delay={{ show: 250, hide: 400 }}
            overlay={
              <Tooltip id={props.categoryKey + "_" + props.fieldKey + "_3"}>
                Required option
              </Tooltip>
            }
          >
            <label htmlFor={props.categoryKey + "_" + props.fieldKey + "_3"}>
              <i className="fa fa-exclamation" aria-hidden="true"></i>
            </label>
          </OverlayTrigger>
        </div>
      </td>
    </tr>
  );
}

function NoResultsRow() {
  return (
    <tr>
      <td>
        <span role="img" aria-label="Not amused">
          😐
        </span>{" "}
        No modified properties
      </td>
    </tr>
  );
}

export default FilterAside;
