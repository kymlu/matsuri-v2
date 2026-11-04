import { act, render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { Choreo } from "../models/choreo";
import { getChoreoFile } from "../lib/helpers/apiHelper";
import { getSeenVersion, setSeenVersion } from "../lib/dataAccess/LocalStorageController";
import { SAMPLE_STAGE_ID } from "../lib/consts/consts";
import ChoreoViewPage from "./ChoreoViewPage";

// The Konva stage needs a canvas; only its change log button matters here.
jest.mock("../components/grid/MainStage", () => ({
  __esModule: true,
  default: ({ openChangeLog }: { openChangeLog?: () => void }) =>
    openChangeLog ? <button onClick={openChangeLog}>change log button</button> : null,
}));

// Not part of the change log, and need browser APIs jsdom lacks (jsPDF, IntersectionObserver, scrollIntoView).
jest.mock("../components/dialogs/ExportDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("../components/editor/ViewerSidebar", () => ({ __esModule: true, default: () => null }));

jest.mock("../lib/helpers/apiHelper", () => ({
  ...jest.requireActual("../lib/helpers/apiHelper"),
  getChoreoFile: jest.fn(),
}));

const mockGetChoreoFile = getChoreoFile as jest.Mock;

function makeChoreo(version: number, sakuraX = 1): Choreo {
  return {
    id: "c1",
    name: "隊列",
    event: "祭り",
    version,
    stageType: "stage",
    stageGeometry: {
      stageWidth: 10,
      stageLength: 8,
      margin: { topMargin: 1, leftMargin: 1, rightMargin: 1, bottomMargin: 1 },
      yAxis: "top-down",
    },
    sections: [{
      id: "s1",
      name: "サビ1",
      formation: {
        dancerPositions: {
          d1: { dancerId: "d1", x: sakuraX, y: 1, sectionId: "s1", type: "dancer", color: "#000000" },
          d2: { dancerId: "d2", x: 3, y: 1, sectionId: "s1", type: "dancer", color: "#000000" },
        },
        dancerActions: [],
        propPositions: {},
      },
    }],
    dancers: { d1: { id: "d1", name: "さくら" }, d2: { id: "d2", name: "あおい" } },
    props: {},
  };
}

const current = makeChoreo(2, 5);

function renderPage(overrides: Partial<Parameters<typeof ChoreoViewPage>[0]> = {}) {
  return render(
    <ChoreoViewPage
      goToHomePage={() => {}}
      goToEditPage={() => {}}
      currentChoreo={current}
      currentChoreoStatus="upToDate"
      savedDancerName={null}
      teamId="team_1"
      {...overrides}
    />
  );
}

const hintTitle = "利用方法";
const changeLogTitle = "前回からの変更";
const findBanner = () => screen.findByRole("button", { name: /前回から変更があります/ });
const queryBanner = () => screen.queryByRole("button", { name: /前回から変更があります/ });

// Lets the stubbed download and the comparison finish.
const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

describe("ChoreoViewPage change log", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetChoreoFile.mockReset();
  });

  it("stores the version on first open and shows the hint instead", async () => {
    renderPage();
    expect(await screen.findByText(hintTitle)).toBeInTheDocument();
    expect(getSeenVersion("c1")).toBe(2);
    expect(mockGetChoreoFile).not.toHaveBeenCalled();
    expect(screen.queryByText("change log button")).not.toBeInTheDocument();
  });

  it("shows a banner after an update, alongside the usual hint", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue(makeChoreo(1));
    renderPage();

    expect(await screen.findByText(hintTitle)).toBeInTheDocument();
    fireEvent.click(screen.getByText("OK"));
    expect(await findBanner()).toBeInTheDocument();
    expect(mockGetChoreoFile).toHaveBeenCalledWith("team_1", "c1", 1);
    expect(screen.queryByText(changeLogTitle)).not.toBeInTheDocument();
    expect(screen.queryByText("change log button")).not.toBeInTheDocument();
    expect(getSeenVersion("c1")).toBe(2);
  });

  it("opens on 全体 from the banner when nobody is selected", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue(makeChoreo(1));
    renderPage();

    fireEvent.click(await screen.findByText("OK"));
    fireEvent.click(await findBanner());
    expect(await screen.findByText(changeLogTitle)).toBeInTheDocument();
    expect(screen.getByText("v1 → v2")).toBeInTheDocument();
    expect(screen.getByText("名前を選ぶと、その人の変更を確認できます。")).toBeInTheDocument();
  });

  it("opens on the saved name's dancer when they have changes", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue(makeChoreo(1));
    renderPage({ savedDancerName: "さくら" });

    fireEvent.click(await findBanner());
    expect(await screen.findByText("新しい位置：")).toBeInTheDocument();
  });

  it("opens on 全体 when the saved name's dancer has no changes", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue(makeChoreo(1));
    renderPage({ savedDancerName: "あおい" });

    fireEvent.click(await findBanner());
    expect(await screen.findByText("名前を選ぶと、その人の変更を確認できます。")).toBeInTheDocument();
  });

  it("replaces the banner with the stage button after it's tapped", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue(makeChoreo(1));
    renderPage({ savedDancerName: "さくら" });

    fireEvent.click(await findBanner());
    fireEvent.click(await screen.findByText("OK"));
    await waitFor(() => expect(screen.queryByText(changeLogTitle)).not.toBeInTheDocument());
    expect(queryBanner()).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("change log button"));
    expect(await screen.findByText(changeLogTitle)).toBeInTheDocument();
  });

  it("replaces the banner with the stage button once the banner is closed", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue(makeChoreo(1));
    renderPage({ savedDancerName: "さくら" });

    const banner = await findBanner();
    fireEvent.click(within(banner.closest("div")!).getByRole("button", { name: "clear" }));
    expect(queryBanner()).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("change log button"));
    expect(await screen.findByText(changeLogTitle)).toBeInTheDocument();
  });

  it("shows no banner or button when only hidden things changed", async () => {
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockResolvedValue({ ...makeChoreo(1, 5), name: "旧名" });
    renderPage();
    await settle();

    expect(queryBanner()).not.toBeInTheDocument();
    expect(screen.queryByText("change log button")).not.toBeInTheDocument();
  });

  it("shows nothing but still stores the version when the old file can't be loaded", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    setSeenVersion("c1", 1);
    mockGetChoreoFile.mockRejectedValue(new Error("404"));
    renderPage();
    await settle();

    expect(queryBanner()).not.toBeInTheDocument();
    expect(getSeenVersion("c1")).toBe(2);
  });

  it("stores the current version and compares nothing when the stored one is newer", async () => {
    setSeenVersion("c1", 5);
    renderPage();

    expect(await screen.findByText(hintTitle)).toBeInTheDocument();
    expect(mockGetChoreoFile).not.toHaveBeenCalled();
    expect(getSeenVersion("c1")).toBe(2);
  });

  it.each<[string, Partial<Parameters<typeof ChoreoViewPage>[0]>]>([
    ["a past version", { pastVersion: 1 }],
    ["an edited choreo", { currentChoreoStatus: "edited" }],
    ["a local-only choreo", { currentChoreoStatus: "localOnly" }],
    ["no team", { teamId: undefined }],
    ["a sample", { currentChoreo: { ...current, id: SAMPLE_STAGE_ID } }],
  ])("does nothing for %s", async (_, overrides) => {
    setSeenVersion("c1", 1);
    setSeenVersion(SAMPLE_STAGE_ID, 1);
    renderPage(overrides);

    expect(await screen.findByText(hintTitle)).toBeInTheDocument();
    expect(mockGetChoreoFile).not.toHaveBeenCalled();
    expect(getSeenVersion("c1")).toBe(1);
    expect(getSeenVersion(SAMPLE_STAGE_ID)).toBe(1);
  });
});
