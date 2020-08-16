import React from "react";
import Description from "./Description";
import { FiCheckCircle, FiHelpCircle, FiSlash } from "react-icons/fi";
import { ColumnProps } from "primereact/column";
import { LinkContainer } from "react-router-bootstrap";
import Button from "react-bootstrap/Button";

export type CmsTableData = { [columnKey: string]: TableCellData }[];
export type BodyTemplate = (
  rowData: TableRowData,
  column: ColumnProps
) => JSX.Element | null;

export type TableCellData = {
  name: string;
  value?: boolean | undefined;
  description?: string;
  info?: string;
};

export type TableRowData = { [columnKey: string]: TableCellData };

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
  return (
    <LinkContainer to={`/detail/${cellData.info}`}>
      <Button>{cellData.name}</Button>
    </LinkContainer>
  );
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

export const sortData = (
  data: CmsTableData,
  event: { field: string; order: number }
): CmsTableData => {
  return data.sort((a: TableRowData, b: TableRowData) => {
    const aData = a[event.field];
    const bData = b[event.field];
    const aValue = aData?.value ?? aData?.info ?? aData?.name;
    const bValue = bData?.value ?? bData?.info ?? bData?.name;
    return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * event.order;
  });
};
