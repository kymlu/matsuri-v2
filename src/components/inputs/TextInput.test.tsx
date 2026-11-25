import { fireEvent, render, screen } from "@testing-library/react";
import TextInput from "./TextInput";

describe("TextInput search", () => {
  it("shows the keyboard's 検索 key and closes the keyboard on it", () => {
    render(<TextInput search placeholder="名前で検索" onContentChange={() => {}}/>);
    const input = screen.getByPlaceholderText("名前で検索");
    expect(input).toHaveAttribute("enterkeyhint", "search");
    input.focus();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).not.toHaveFocus();
  });

  it("leaves other fields alone", () => {
    render(<TextInput placeholder="名前" onContentChange={() => {}}/>);
    expect(screen.getByPlaceholderText("名前")).not.toHaveAttribute("enterkeyhint");
  });
});
