import React from "react";
import { BrowserRouter } from "react-router-dom";

import { render } from "@testing-library/react";
import App from "./App";

beforeAll(() => {
  window.scrollTo = jest.fn();
});

test("renders the word cms", () => {
  const { getByText } = render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const linkElement = getByText("CMS Comparison");
  expect(linkElement).toBeInTheDocument();
});
