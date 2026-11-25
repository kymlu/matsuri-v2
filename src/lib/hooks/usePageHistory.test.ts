import { act, renderHook } from "@testing-library/react";
import { usePageHistory } from "./usePageHistory";

type Mode = "home" | "view" | "edit";

const back = async () => {
  await act(async () => {
    window.history.back();
    await new Promise(resolve => window.addEventListener("popstate", resolve, { once: true }));
  });
};

describe("usePageHistory", () => {
  beforeEach(() => window.history.replaceState(null, ""));

  it("returns home on back", async () => {
    const { result } = renderHook(() => usePageHistory<Mode>("home"));
    act(() => result.current.goTo("view"));
    expect(result.current.mode).toBe("view");
    await back();
    expect(result.current.mode).toBe("home");
  });

  it("goes home in one back after switching between pages", async () => {
    const { result } = renderHook(() => usePageHistory<Mode>("home"));
    act(() => result.current.goTo("view"));
    act(() => result.current.goTo("edit"));
    expect(window.history.state).toEqual({ matsuriPage: "edit" });
    await back();
    expect(result.current.mode).toBe("home");
    expect(window.history.state).toBeNull();
  });

  it("stays put while leaving is blocked", async () => {
    const { result } = renderHook(() => usePageHistory<Mode>("home"));
    act(() => result.current.goTo("edit"));
    result.current.leaveBlockedRef.current = true;
    await back();
    expect(result.current.mode).toBe("edit");
    expect(window.history.state).toEqual({ matsuriPage: "edit" });
  });

  it("the home button removes the page's entry", async () => {
    const { result } = renderHook(() => usePageHistory<Mode>("home"));
    act(() => result.current.goTo("view"));
    await act(async () => {
      result.current.goTo("home");
      await new Promise(resolve => window.addEventListener("popstate", resolve, { once: true }));
    });
    expect(result.current.mode).toBe("home");
    expect(window.history.state).toBeNull();
  });
});
