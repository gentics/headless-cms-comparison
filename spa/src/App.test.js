import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

test("renders the word cms", () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/cms/i);
  expect(linkElement).toBeInTheDocument();
});
