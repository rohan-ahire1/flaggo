import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BottomNav from "../BottomNav";

function Harness() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current path">{location.pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Browser back</button>
      <BottomNav />
    </>
  );
}

describe("BottomNav", () => {
  it("uses the home screen as the single Learn destination", () => {
    render(
      <MemoryRouter initialEntries={["/review"]}>
        <Routes>
          <Route path="*" element={<Harness />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Learn" }));

    expect(screen.getByLabelText("Current path")).toHaveTextContent("/");
    expect(screen.getByRole("link", { name: "Learn" })).toHaveAttribute("aria-current", "page");
  });

  it("replaces tab history instead of stacking previously selected tabs", () => {
    render(
      <MemoryRouter initialEntries={["/before-app", "/review"]} initialIndex={1}>
        <Routes>
          <Route path="*" element={<Harness />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Learn" }));
    fireEvent.click(screen.getByRole("button", { name: "Browser back" }));

    expect(screen.getByLabelText("Current path")).toHaveTextContent("/before-app");
  });
});
