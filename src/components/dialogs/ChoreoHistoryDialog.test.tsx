import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Dialog } from "@base-ui/react";
import { getChoreoHistory } from "../../lib/helpers/apiHelper";
import { ChoreoHistoryDialog } from "./ChoreoHistoryDialog";

jest.mock("../../lib/helpers/apiHelper", () => ({
  getChoreoHistory: jest.fn(),
  getPublicChoreoHistory: jest.fn(),
}));

const mockGetChoreoHistory = getChoreoHistory as jest.Mock;
const failMessage = "v2を読み込めませんでした。通信環境を確認して、もう一度お試しください。";

function renderDialog(onSelectVersion: (version: number) => Promise<boolean>) {
  return render(
    <Dialog.Root open>
      <ChoreoHistoryDialog
        teamId="team_1"
        choreoId="c1"
        isLoggedIn
        isEditing={false}
        onClose={() => {}}
        onSelectVersion={onSelectVersion}/>
    </Dialog.Root>
  );
}

// A load the test finishes by hand, to check what shows while it's in progress.
function pendingLoad() {
  let finish: (isLoaded: boolean) => void = () => {};
  const load = jest.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
  return { load, finish: (isLoaded: boolean) => finish(isLoaded) };
}

describe("ChoreoHistoryDialog", () => {
  beforeEach(() => {
    mockGetChoreoHistory.mockResolvedValue([
      { version: 3, uploadedAt: "2026-10-03T10:00:00Z" },
      { version: 2, uploadedAt: "2026-10-02T10:00:00Z" },
      { version: 1, uploadedAt: "2026-10-01T10:00:00Z" },
    ]);
  });

  it("shows a spinner on the tapped version and ignores other taps while it loads", async () => {
    const { load, finish } = pendingLoad();
    renderDialog(load);

    fireEvent.click(await screen.findByText("v2"));
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
    fireEvent.click(screen.getByText("v1"));
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(2);

    finish(true);
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(failMessage)).not.toBeInTheDocument();
  });

  it("says when a version can't be loaded, and lets it be tried again", async () => {
    const { load, finish } = pendingLoad();
    renderDialog(load);

    fireEvent.click(await screen.findByText("v2"));
    finish(false);
    expect(await screen.findByText(failMessage)).toBeInTheDocument();
    expect(screen.queryByLabelText("読み込み中")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("v2"));
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(failMessage)).not.toBeInTheDocument();
  });

  it("doesn't load the latest version", async () => {
    const load = jest.fn(() => Promise.resolve(true));
    renderDialog(load);

    fireEvent.click(await screen.findByText("v3"));
    expect(load).not.toHaveBeenCalled();
  });
});
