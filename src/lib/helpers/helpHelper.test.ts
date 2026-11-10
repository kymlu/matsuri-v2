import { HELP_ARTICLES, HELP_ARTICLES_BY_ID } from "../content/helpContent";
import { appliesTo, getHelpContents, HelpReader, normalizeHelpText, searchHelp } from "./helpHelper";

const solo: HelpReader = { hasTeam: false, isLoggedIn: false, isViewer: false, isAdmin: false };
const dancer: HelpReader = { hasTeam: true, isLoggedIn: false, isViewer: false, isAdmin: false };
const viewer: HelpReader = { hasTeam: true, isLoggedIn: true, isViewer: true, isAdmin: false };
const editor: HelpReader = { hasTeam: true, isLoggedIn: true, isViewer: false, isAdmin: false };
const admin: HelpReader = { hasTeam: true, isLoggedIn: true, isViewer: false, isAdmin: true };

describe("help content", () => {
  it("has unique ids and links only to articles that exist", () => {
    expect(new Set(HELP_ARTICLES.map(a => a.id)).size).toBe(HELP_ARTICLES.length);
    HELP_ARTICLES.forEach(a => {
      [...(a.related ?? []), ...(a.stages ?? []).map(s => s.article)].forEach(id => {
        expect(HELP_ARTICLES_BY_ID[id]).toBeDefined();
      });
    });
  });

  it("gives every article something to search by", () => {
    HELP_ARTICLES.forEach(a => expect(a.keywords.length).toBeGreaterThan(0));
  });
});

describe("who an article is for", () => {
  it("keeps publishing for editors and admins", () => {
    const publish = HELP_ARTICLES_BY_ID["publish"];
    expect(appliesTo(publish, editor)).toBe(true);
    expect(appliesTo(publish, admin)).toBe(true);
    expect(appliesTo(publish, viewer)).toBe(false);
    expect(appliesTo(publish, dancer)).toBe(false);
    expect(appliesTo(publish, solo)).toBe(false);
  });

  it("shows the team pointer only to solo users", () => {
    expect(appliesTo(HELP_ARTICLES_BY_ID["share-solo"], solo)).toBe(true);
    expect(appliesTo(HELP_ARTICLES_BY_ID["share-solo"], dancer)).toBe(false);
  });
});

describe("contents order", () => {
  const groupsOf = (r: HelpReader) => getHelpContents(r).groups.map(g => g.group);
  const openOf = (r: HelpReader) => getHelpContents(r).groups.filter(g => g.open).map(g => g.group);

  it("puts viewing first for dancers and making first for editors", () => {
    expect(groupsOf(dancer)[0]).toBe("view");
    expect(groupsOf(editor)[0]).toBe("edit");
  });

  it("opens only the reader's own main group, plus 困ったとき", () => {
    expect(openOf(dancer)).toEqual(["view", "trouble"]);
    expect(openOf(viewer)).toEqual(["view", "trouble"]);
    expect(openOf(editor)).toEqual(["edit", "trouble"]);
    expect(openOf(solo)).toEqual(["view", "edit", "trouble"]);
  });

  it("moves articles the reader can't use under ほかの役割の方向け", () => {
    const dancerContents = getHelpContents(dancer);
    expect(dancerContents.others.map(a => a.id)).toContain("publish");
    expect(dancerContents.groups.flatMap(g => g.articles).map(a => a.id)).not.toContain("publish");
    expect(getHelpContents(admin).others.map(a => a.id)).not.toContain("members-invite");
  });

  it("offers the walkthrough that fits the reader", () => {
    expect(getHelpContents(dancer).walkthrough.id).toBe("view-walkthrough");
    expect(getHelpContents(editor).walkthrough.id).toBe("edit-walkthrough");
  });

  it("keeps 用語 last", () => {
    [solo, dancer, editor, admin].forEach(r => expect(groupsOf(r).at(-1)).toBe("terms"));
  });
});

describe("search", () => {
  it("ignores katakana/hiragana and width differences", () => {
    expect(normalizeHelpText("ＰＤＦ")).toBe("pdf");
    expect(normalizeHelpText("パスワード")).toBe(normalizeHelpText("ぱすわーど"));
  });

  it("finds articles by keyword, title matches first", () => {
    const { matches } = searchHelp("立ち位置");
    expect(matches[0].id).toBe("find-position");
  });

  it("finds by words that aren't in the title", () => {
    expect(searchHelp("印刷").matches.map(a => a.id)).toContain("save-pdf");
  });

  it("suggests something near when nothing matches", () => {
    const result = searchHelp("ラインで送る");
    expect(result.matches).toHaveLength(0);
    expect(result.near.length).toBeGreaterThan(0);
  });

  it("returns nothing for an empty query", () => {
    expect(searchHelp("  ")).toEqual({ matches: [], near: [] });
  });
});
