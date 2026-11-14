// Silence the browser console first: logHelper wraps whatever console.error is when it loads.
jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "debug").mockImplementation(() => {});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getLogText, setBuildDateForLogs } = require("./logHelper") as typeof import("./logHelper");

const lastLine = () => {
  const text = getLogText();
  return text.slice(text.lastIndexOf("\n[") + 1);
};

describe("logHelper", () => {
  it("writes an Error's name, message and stack instead of {}", () => {
    console.error("getChoreoFile failed:", new TypeError("Failed to fetch"));
    const line = lastLine();
    expect(line).toContain("[ERROR] getChoreoFile failed: TypeError: Failed to fetch");
    expect(line).toContain("logHelper.test");
    expect(line).not.toContain("{}");
  });

  it("writes a DOMException's name and message", () => {
    console.error("upsertItem on choreo failed:", new DOMException("Quota exceeded", "QuotaExceededError"));
    expect(lastLine()).toContain("upsertItem on choreo failed: QuotaExceededError: Quota exceeded");
  });

  it("trims very long lines", () => {
    console.error("x".repeat(5000));
    const line = lastLine();
    expect(line).toContain("…(trimmed 3000 characters)");
    expect(line.length).toBeLessThan(2100);
  });

  it("does not keep console.debug", () => {
    console.debug("routine detail");
    expect(getLogText()).not.toContain("routine detail");
  });

  it("puts the build date in the header", () => {
    setBuildDateForLogs("2026-11-14");
    expect(getLogText()).toContain("Build: 2026-11-14");
  });
});
