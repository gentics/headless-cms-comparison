import React from "react";
import ReactGA from "react-ga";

import {
  FilterFieldSet,
  FilterPreset,
  allFilterPresets,
  ActivePreset,
  SHOW_ALL,
  SHOW_CUSTOM,
} from "./Cms";

import FilterService from "./FilterService";
import classNames from "classnames";

type PropsType = {
  filterFields: { untouched: FilterFieldSet; activePreset: ActivePreset };
  updateFilterFields: (
    updatedFilterFields: FilterFieldSet,
    preset: ActivePreset
  ) => void;
  toggleAside: () => void;
  cookiesAccepted: boolean;
};

export const FilterMenu = (props: PropsType): JSX.Element => {
  const resetPanel = () => {
    props.updateFilterFields(props.filterFields.untouched, SHOW_ALL);
  };

  const resetToPreset = (preset: FilterPreset, name: string): void => {
    const newFilter = FilterService.getPresetFilterFields(
      props.filterFields.untouched,
      preset
    );
    props.updateFilterFields(newFilter, preset);
    if (props.cookiesAccepted) {
      ReactGA.event({ category: "ApplyFilterPreset", action: name });
    }
  };

  const activeClassFor = (preset: ActivePreset): string =>
    classNames({ active: props.filterFields.activePreset === preset });

  const presetButtons = allFilterPresets().map(
    (p: { name: string; preset: FilterPreset }) => (
      <li
        key={p.preset}
        onClick={() => resetToPreset(p.preset, p.name)}
        className={activeClassFor(p.preset)}
      >
        {" "}
        {p.name}{" "}
      </li>
    )
  );

  return (
    <section id="filter-menu">
      <div className="w-75 filters">
        <ul className="controls">
          <li onClick={() => resetPanel()} className={activeClassFor(SHOW_ALL)}>
            All
          </li>
          {presetButtons}
          <li
            onClick={() => props.toggleAside()}
            className={activeClassFor(SHOW_CUSTOM)}
          >
            {" "}
            Custom{" "}
          </li>
        </ul>
      </div>
    </section>
  );
};

export default FilterMenu;
