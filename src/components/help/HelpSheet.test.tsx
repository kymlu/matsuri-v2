import { fireEvent, render, screen } from "@testing-library/react";
import { HelpProvider, useHelp } from "./HelpContext";
import { HelpReader } from "../../lib/helpers/helpHelper";

const dancer: HelpReader = { hasTeam: true, isLoggedIn: false, isViewer: false, isAdmin: false };
const editor: HelpReader = { hasTeam: true, isLoggedIn: true, isViewer: false, isAdmin: false };

function Opener({ target }: { target?: Parameters<ReturnType<typeof useHelp>>[0] }) {
  const openHelp = useHelp();
  return <button onClick={() => openHelp(target)}>open</button>;
}

function renderHelp(reader: HelpReader, target?: Parameters<ReturnType<typeof useHelp>>[0]) {
  render(<HelpProvider reader={reader}><Opener target={target}/></HelpProvider>);
  fireEvent.click(screen.getByText("open"));
}

beforeEach(() => localStorage.clear());

describe("HelpSheet", () => {
  it("opens on the contents, with the reader's group listed", () => {
    renderHelp(dancer);
    expect(screen.getByText("使い方")).toBeInTheDocument();
    expect(screen.getByText("自分の立ち位置を確認する")).toBeInTheDocument();
    expect(screen.getByText("はじめての方へ")).toBeInTheDocument();
  });

  it("opens an article and goes back to the contents", () => {
    renderHelp(dancer);
    fireEvent.click(screen.getByText("自分の立ち位置を確認する"));
    expect(screen.getByText("舞台で自分の名前をタップすると、下のパネルに位置とカウントが出ます。")).toBeInTheDocument();
    fireEvent.click(screen.getByText("使い方"));
    expect(screen.getByText("隊列表を見る")).toBeInTheDocument();
  });

  it("shows role tags on articles for other roles", () => {
    renderHelp(dancer, { article: "publish" });
    expect(screen.getByText("編集者")).toBeInTheDocument();
  });

  it("doesn't tag articles that are for the reader", () => {
    renderHelp(editor, { article: "publish" });
    expect(screen.queryByText("編集者")).not.toBeInTheDocument();
  });

  it("opens the walkthrough from 🔰 the first time only", () => {
    renderHelp(dancer, { beginner: true });
    expect(screen.getByRole("heading", { name: "隊列表の見方" })).toBeInTheDocument();
  });

  it("searches, and offers 困ったとき when nothing matches", () => {
    renderHelp(dancer);
    fireEvent.click(screen.getByLabelText("検索"));
    fireEvent.input(screen.getByPlaceholderText("やりたいことを探す"), { target: { value: "zzzz" } });
    expect(screen.getByText("「zzzz」は見つかりませんでした。")).toBeInTheDocument();
    expect(screen.getByText("パスワードを聞かれる")).toBeInTheDocument();
  });
});
