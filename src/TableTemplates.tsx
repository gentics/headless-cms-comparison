import React from "react";
import Description from "./Description";
import { FiCheckCircle, FiHelpCircle, FiSlash } from "react-icons/fi";
import { ColumnProps } from "primereact/column";

export type CmsTableData = { [columnKey: string]: TableData }[];
export type BodyTemplate = (
  rowData: { [columnKey: string]: TableData },
  column: ColumnProps
) => JSX.Element | null;

export type TableData = {
  name: string;
  value?: boolean | undefined;
  description?: string;
  info?: string;
};

export const TitleTemplate: BodyTemplate = (rowData, column) => {
  if (!column.field) return null;
  const cellData = rowData[column.field];
  return (
    <div className="d-flex justify-content-between">
      <span className="ml-2">
        {cellData.description ? (
          <Description description={cellData.description || ""} />
        ) : null}
      </span>
      <span className="mr-2">{cellData.name}</span>
    </div>
  );
};

export const NameTemplate: BodyTemplate = (rowData, column) => {
  if (!column.field) return null;
  const cellData = rowData[column.field];
  return <span>{cellData.name}</span>;
};

export const BooleanPropertyTemplate: BodyTemplate = (rowData, column) => {
  if (!column.field) return null;
  const cellData = rowData[column.field];
  const bool =
    cellData && cellData.value !== null ? (
      cellData.value ? (
        <FiCheckCircle aria-label="yes" style={{ color: "green" }} />
      ) : cellData.value === undefined ? (
        <FiHelpCircle aria-label="unknown" style={{ color: "orange" }} />
      ) : (
        <FiSlash aria-label="no" style={{ color: "red" }} />
      )
    ) : null;

  const info = cellData?.info ? <span> {cellData.info}</span> : null;
  return (
    <>
      {bool}
      {info}
    </>
  );
};

export const SpecialPropertyTemplate: BodyTemplate = (rowData, column) => {
  if (!column.field) return null;
  const cellData = rowData[column.field];
  return cellData?.info ? <span>{cellData.info}</span> : null;
};
