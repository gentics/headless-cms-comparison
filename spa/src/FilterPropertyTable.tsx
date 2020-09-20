import React from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
// import Card from "react-bootstrap/esm/Card";
import { Card } from "primereact/card";

import {
  ScoreValue,
  FilterFieldSet,
  SpecialField,
  ScoreField,
  CategoryField,
} from "./Cms";

import { getKeysOfSubFields, isScoreField } from "./CmsService";
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
  const {
    filterFields,
    specialFieldChangeHandler,
    basicFieldChangeHandler,
  } = props;

  const generalRows: JSX.Element[] = [];
  const categoryRows: {
    [categoryName: string]: {
      title: string;
      description: string;
      children: JSX.Element[];
    };
  } = {};

  Object.keys(filterFields.special).forEach((fieldKey: string) => {
    const currentField = props.filterFields.special[fieldKey];
    generalRows.push(
      <CheckboxRow
        key={fieldKey}
        specialField={currentField}
        fieldKey={fieldKey}
        changeHandler={specialFieldChangeHandler}
      />
    );
  });

  Object.keys(filterFields.basic).forEach((fieldKey: string) => {
    const currentField = filterFields.basic[fieldKey];

    if (isScoreField(currentField)) {
      generalRows.push(
        <ScoreRow
          key={fieldKey}
          scoreField={currentField}
          fieldKey={fieldKey}
          changeHandler={basicFieldChangeHandler}
        />
      );
    } else {
      const children: JSX.Element[] = getKeysOfSubFields(currentField).map(
        (subKey: string) => {
          const currentField = (filterFields.basic[fieldKey] as CategoryField)[
            subKey
          ];
          return (
            <ScoreRow
              key={`${fieldKey}_${subKey}`}
              scoreField={currentField}
              fieldKey={subKey}
              changeHandler={basicFieldChangeHandler}
              categoryKey={fieldKey}
            />
          );
        }
      );

      categoryRows[fieldKey] = {
        title: currentField.name,
        description: currentField.description,
        children,
      };
    }
  });

  const cards: JSX.Element[] = [];
  if (generalRows.length > 0) {
    cards.push(
      <CategoryCard key="general" title="General" children={generalRows} />
    );
  }
  Object.keys(categoryRows).forEach((categoryName: string) => {
    const category = categoryRows[categoryName];
    cards.push(<CategoryCard key={categoryName} {...category} />);
  });

  return (
    <div style={{ maxHeight: "100%", overflow: "yes" }}>
      <form id="filterForm">
        {cards.length > 0 ? cards : <NoResultsRow key="no" />}
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
    <div className="score-row">
      <div className="core-field-name">
        <span className="mr-2">{props.specialField.name}</span>
      </div>
      <div className="score-checkboxes">{checkboxes}</div>
    </div>
  );
};

const SimpleCheckbox = (props: {
  fieldKey: string;
  value: string;
  checked: boolean;
  changeHandler: (e: InputChangeEvent) => void;
}): JSX.Element => {
  return (
    <div>
      <input
        type="checkbox"
        name={props.fieldKey}
        value={props.value}
        checked={props.checked}
        onChange={props.changeHandler}
        id={props.value}
      />
      <label htmlFor={props.value} style={{ paddingRight: "2px" }}>
        {props.value}
      </label>
    </div>
  );
};

const CategoryCard = (props: {
  title: string;
  description?: string;
  children: JSX.Element[];
}): JSX.Element => {
  const description = props.description ? (
    <span className="description">
      <Description description={props.description} />
    </span>
  ) : null;
  return (
    <Card title={props.title} className="my-5">
      {description}
      {props.children}
    </Card>
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
  return (
    <div className="score-row">
      <div className="core-field-name">
        <OverlayTrigger
          placement="top"
          delay={{ show: 100, hide: 200 }}
          overlay={
            <Tooltip id={"scoreFieldName"}>
              {props.scoreField.description}
            </Tooltip>
          }
        >
          <span>{props.scoreField.name}</span>
        </OverlayTrigger>
      </div>
      <ScoreValueCheckbox
        name={props.categoryKey + "_" + props.fieldKey}
        value={props.scoreField.value || ScoreValue.DONT_CARE}
        changeHandler={(e: InputChangeEvent) =>
          props.changeHandler(e, props.fieldKey, props.categoryKey)
        }
      />
    </div>
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
    <>
      <span role="img" aria-label="Not amused">
        😐
      </span>{" "}
      No modified properties
    </>
  );
};

export default FilterPropertyTable;
