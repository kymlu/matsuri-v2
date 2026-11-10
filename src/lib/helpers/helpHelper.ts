import { HELP_ARTICLES, HelpArticle, HelpGroupId, HelpRole } from "../content/helpContent";

// Who is reading help. Comes from App's login state.
export type HelpReader = {
  hasTeam: boolean,
  isLoggedIn: boolean,
  isViewer: boolean,
  isAdmin: boolean,
};

export function hasRole(reader: HelpReader, role: HelpRole): boolean {
  switch (role) {
    case "solo": return !reader.hasTeam;
    case "team": return reader.hasTeam;
    case "loggedIn": return reader.hasTeam && reader.isLoggedIn;
    case "editor": return reader.hasTeam && reader.isLoggedIn && !reader.isViewer;
    case "admin": return reader.hasTeam && reader.isLoggedIn && reader.isAdmin;
  }
}

export function appliesTo(article: HelpArticle, reader: HelpReader): boolean {
  return (article.roles ?? []).every(role => hasRole(reader, role));
}

export function isEditorReader(reader: HelpReader): boolean {
  return hasRole(reader, "editor");
}

export type HelpContentsGroup = {
  group: HelpGroupId,
  articles: HelpArticle[],
  // Open at first. Groups for the reader's main tasks, and 困ったとき.
  open: boolean,
};

export type HelpContents = {
  // The 🔰 walkthrough for this reader.
  walkthrough: HelpArticle,
  groups: HelpContentsGroup[],
  // Articles that don't apply to this reader, kept under ほかの役割の方向け.
  others: HelpArticle[],
};

// Groups in the order this reader needs them. 困ったとき and 用語 always come last.
export function getGroupOrder(reader: HelpReader): HelpGroupId[] {
  return isEditorReader(reader)
    ? ["edit", "view", "team", "trouble", "terms"]
    : ["view", "edit", "team", "trouble", "terms"];
}

function isOpenByDefault(group: HelpGroupId, reader: HelpReader): boolean {
  if (group === "trouble") return true;
  if (!reader.hasTeam) return group === "view" || group === "edit";
  return isEditorReader(reader) ? group === "edit" : group === "view";
}

export function getHelpContents(reader: HelpReader, articles: HelpArticle[] = HELP_ARTICLES): HelpContents {
  const walkthroughId = isEditorReader(reader) ? "edit-walkthrough" : "view-walkthrough";
  const walkthrough = articles.find(a => a.id === walkthroughId)!;

  const groups = getGroupOrder(reader)
    .map(group => ({
      group,
      articles: articles.filter(a => a.group === group && appliesTo(a, reader)),
      open: isOpenByDefault(group, reader),
    }))
    .filter(g => g.articles.length > 0);

  return {
    walkthrough,
    groups,
    others: articles.filter(a => !appliesTo(a, reader)),
  };
}

// Katakana → hiragana, full-width → half-width, lower case, no spaces, so
// 「ぱすわーど」 finds パスワード and 「pdf」 finds PDF.
export function normalizeHelpText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/\s+/g, "");
}

function searchableText(article: HelpArticle): string {
  return normalizeHelpText([article.title, article.summary, ...article.keywords].join(" "));
}

export type HelpSearchResult = {
  matches: HelpArticle[],
  // When nothing matches: articles sharing part of the query, so the reader isn't left with nothing.
  near: HelpArticle[],
};

export function searchHelp(query: string, articles: HelpArticle[] = HELP_ARTICLES): HelpSearchResult {
  const q = normalizeHelpText(query);
  if (q.length === 0) return { matches: [], near: [] };

  const titleFirst = (a: HelpArticle, b: HelpArticle) =>
    Number(normalizeHelpText(b.title).includes(q)) - Number(normalizeHelpText(a.title).includes(q));

  const matches = articles.filter(a => searchableText(a).includes(q)).sort(titleFirst);
  if (matches.length > 0 || q.length < 2) return { matches, near: [] };

  // Any two-character piece of the query, e.g. 「ラインで送る」 → 「送る」.
  const pieces = new Set<string>();
  for (let i = 0; i < q.length - 1; i++) pieces.add(q.slice(i, i + 2));
  const near = articles
    .filter(a => a.keywords.some(k => Array.from(pieces).some(p => normalizeHelpText(k).includes(p))))
    .slice(0, 5);
  return { matches, near };
}
