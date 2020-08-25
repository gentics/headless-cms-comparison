import React from "react";

import { FilterFieldSet, FilterPreset, allFilterPresets } from "./Cms";

import FilterService from "./FilterService";

type PropsType = {
  filterFields: { actual: FilterFieldSet; untouched: FilterFieldSet };
  updateFilterFields: (updatedFilterFields: FilterFieldSet) => void;
  toggleAside: () => void;
};

export const FilterMenu = (props: PropsType): JSX.Element => {
  const resetPanel = () => {
    props.updateFilterFields(props.filterFields.untouched);
  };

  const resetToPreset = (preset: FilterPreset): void => {
    const newFilter = FilterService.getPresetFilterFields(
      props.filterFields.untouched,
      preset
    );
    props.updateFilterFields(newFilter);
  };

  const presetButtons = allFilterPresets().map(
    (p: { name: string; preset: FilterPreset }) => (
      <li onClick={() => resetToPreset(p.preset)}> {p.name} </li>
    )
  );

  return (
    <section id="filter-menu">
      <div className="w-75 filters">
        <ul className="controls">
          <li onClick={() => resetPanel()}>All</li>
          {presetButtons}
          <li onClick={() => props.toggleAside()}> Custom </li>
        </ul>
      </div>
    </section>
  );
};

export default FilterMenu;
