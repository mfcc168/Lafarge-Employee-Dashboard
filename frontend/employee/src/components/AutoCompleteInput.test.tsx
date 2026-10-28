import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AutocompleteInput from "./AutoCompleteInput";
afterEach(cleanup);

describe("report field suggestions", () => {
  it("opens only while editing and supports choosing a suggestion by keyboard", () => {
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        value="Dr"
        suggestions={["Dr. Chan", "Dr. Wong"]}
        onChange={onChange}
        inputProps={{ "aria-label": "Client" }}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Client" });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const selected = screen.getByRole("option", { name: "Dr. Wong" });
    expect(selected.getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(selected.id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: "Dr. Wong" } }),
    );
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("does not consume Enter or arrows during Chinese input composition", () => {
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        value="中"
        suggestions={["中環"]}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const enter = new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input, enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    const arrow = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input, arrow);
    expect(arrow.defaultPrevented).toBe(false);
  });
  it("dismisses suggestions on Escape or blur without changing the draft", () => {
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        value="C"
        suggestions={["Central"]}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.getAttribute("aria-expanded")).toBe("false");
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
