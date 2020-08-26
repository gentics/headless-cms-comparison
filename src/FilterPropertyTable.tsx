import React from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import {
  ScoreValue,
  FilterFieldSet,
  SpecialField,
  ScoreField,
  CategoryField,
} from "./Cms";

import CmsService from "./CmsService";
import Description from "./Description";

type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

type PropsType = {
  filterFields: FilterFieldSet;
  specialFieldChangeHandler: (event: InputChangeEvent) => void;
  basicFieldChangeHandler: (
    event: InputChangeEvent,
    fieldKey: string,
    categoryKey?: string
  ) => void;
};

export const FilterPropertyTable = (props: PropsType): JSX.Element => {
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
};

const CheckboxRow = (props: {
  specialField: SpecialField;
  changeHandler: (e: InputChangeEvent) => void;
  fieldKey: string;
}): JSX.Element => {
  let checkboxes: JSX.Element[] = [];
  for (const possibleValue of props.specialField.possibleValues) {
    checkboxes.push(
      <SimpleCheckbox
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
};

const SimpleCheckbox = (props: {
  fieldKey: string;
  value: string;
  checked: boolean;
  changeHandler: (e: InputChangeEvent) => void;
}): JSX.Element => {
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
};

const CategoryRow = (props: {
  title: string;
  description: string;
}): JSX.Element => {
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
};

const ScoreRow = (props: {
  scoreField: ScoreField;
  changeHandler: (
    event: InputChangeEvent,
    fieldKey: string,
    categoryKey?: string
  ) => void;
  fieldKey: string;
  categoryKey?: string;
}): JSX.Element => {
  let style: React.CSSProperties = {};
  if (props.categoryKey) {
    style = { fontStyle: "italic", fontWeight: 800 };
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
        <ScoreValueCheckbox
          name={props.categoryKey + "_" + props.fieldKey}
          value={props.scoreField.value || ScoreValue.DONT_CARE}
          changeHandler={(e: InputChangeEvent) =>
            props.changeHandler(e, props.fieldKey, props.categoryKey)
          }
        />
      </td>
    </tr>
  );
};

const ScoreValueCheckbox = (props: {
  name: string;
  value: ScoreValue;
  changeHandler: (e: InputChangeEvent) => void;
}): JSX.Element => {
  const { name, value, changeHandler } = props;
  return (
    <div className="switch-toggle">
      <input
        id={name + "_1"}
        name={name}
        value={ScoreValue.NICE_TO_HAVE}
        checked={value === ScoreValue.NICE_TO_HAVE}
        onChange={(e: InputChangeEvent) => changeHandler(e)}
        type="radio"
      />
      <OverlayTrigger
        placement="top"
        delay={{ show: 250, hide: 400 }}
        overlay={<Tooltip id={name + "_1"}>Nice to have option</Tooltip>}
      >
        <label htmlFor={name + "_1"}>
          <i className="fas fa-smile" aria-hidden="true"></i>
        </label>
      </OverlayTrigger>

      <input
        id={name + "_2"}
        name={name}
        value={ScoreValue.DONT_CARE}
        checked={value === ScoreValue.DONT_CARE}
        onChange={(e: InputChangeEvent) => changeHandler(e)}
        type="radio"
      />

      <OverlayTrigger
        placement="top"
        delay={{ show: 250, hide: 400 }}
        overlay={
          <Tooltip id={name + "_2"}>I don't care about this option</Tooltip>
        }
      >
        <label htmlFor={name + "_2"}>
          <i className="fa fa-dice" aria-hidden="true"></i>
        </label>
      </OverlayTrigger>

      <input
        id={name + "_3"}
        name={name}
        value={ScoreValue.REQUIRED}
        checked={value === ScoreValue.REQUIRED}
        onChange={(e: InputChangeEvent) => changeHandler(e)}
        type="radio"
      />
      <OverlayTrigger
        placement="top"
        delay={{ show: 250, hide: 400 }}
        overlay={<Tooltip id={name + "_3"}>Required option</Tooltip>}
      >
        <label htmlFor={name + "_3"}>
          <i className="fa fa-exclamation" aria-hidden="true"></i>
        </label>
      </OverlayTrigger>
    </div>
  );
};

const NoResultsRow = (): JSX.Element => {
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
};

export default FilterPropertyTable;
