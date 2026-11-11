import { Dialog } from "@base-ui/react";
import classNames from "classnames";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../basic/Icon";
import ExpandableSection from "../basic/ExpandableSection";
import TextInput from "../inputs/TextInput";
import { Tag } from "../common/Tag";
import { BeginnerMark } from "./HelpInline";
import {
  HELP_ARTICLES_BY_ID, HELP_CONTEXTS, HELP_GROUPS, HELP_ROLE_LABELS,
  HelpArticle, HelpContextId, HelpGroupId,
} from "../../lib/content/helpContent";
import { appliesTo, getHelpContents, HelpReader, searchHelp } from "../../lib/helpers/helpHelper";
import { ICON } from "../../lib/consts/consts";

export type HelpTarget = {
  group?: HelpGroupId,
  article?: string,
  // From the home 🔰 button: open the walkthrough for someone who hasn't used help yet.
  beginner?: boolean,
};

const SEEN_KEY = "matsuri.helpSeen";

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private mode or blocked storage: the 🔰 card just keeps showing.
  }
}

const CONTEXT_ICONS: Record<HelpContextId, keyof typeof ICON> = {
  home: "home",
  view: "visibility",
  edit: "edit",
  roster: "patientList",
  admin: "adminPanelSettings",
};

type HelpSheetProps = {
  open: boolean,
  target?: HelpTarget,
  reader: HelpReader,
  onClose: () => void,
};

export default function HelpSheet({ open, target, reader, onClose }: HelpSheetProps) {
  const contents = useMemo(() => getHelpContents(reader), [reader]);
  // Articles opened in order; empty means the contents page.
  const [stack, setStack] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Partial<Record<HelpGroupId | "others", boolean>>>({});
  const [hasSeen, setHasSeen] = useState(readSeen);
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Partial<Record<HelpGroupId, HTMLDivElement | null>>>({});

  // Each open starts fresh at the requested place.
  useEffect(() => {
    if (!open) return;
    const seen = readSeen();
    setHasSeen(seen);
    setIsSearching(false);
    setQuery("");
    setExpanded(Object.fromEntries(contents.groups.map(g => [
      g.group,
      target?.group ? g.group === target.group || g.group === "trouble" : g.open,
    ])));
    if (target?.article && HELP_ARTICLES_BY_ID[target.article]) {
      setStack([target.article]);
    } else if (target?.beginner && !seen) {
      setStack([contents.walkthrough.id]);
    } else {
      setStack([]);
    }
    writeSeen();
  }, [open, target, contents]);

  // Opened at a group: bring it into view once the contents have rendered.
  useEffect(() => {
    if (open && target?.group && stack.length === 0 && !isSearching) {
      requestAnimationFrame(() => groupRefs.current[target.group!]?.scrollIntoView({ block: "start" }));
    }
  }, [open, target, stack.length, isSearching]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [stack]);

  const current = stack.length > 0 ? HELP_ARTICLES_BY_ID[stack[stack.length - 1]] : undefined;
  const openArticle = (id: string) => {
    setIsSearching(false);
    setStack(s => [...s, id]);
  };
  const goBack = () => setStack(s => s.slice(0, -1));
  const backLabel = stack.length > 1
    ? HELP_ARTICLES_BY_ID[stack[stack.length - 2]].title
    : "使い方";

  return <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black opacity-50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"/>
      <Dialog.Popup
        initialFocus={false}
        className="fixed inset-x-0 bottom-0 top-11 z-40 mx-auto flex w-full max-w-xl flex-col rounded-t-2xl bg-surface text-body shadow-[0_-2px_16px_rgba(0,0,0,0.15)] outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
        <div className="flex-shrink-0 pt-3.5 pb-2">
          <div className="w-1/3 h-1 mx-auto rounded-full bg-primary"/>
        </div>
        <header className="flex items-center flex-shrink-0 gap-1 px-4 pb-2">
          {
            current
              ? <button type="button" onClick={goBack} className="flex items-center flex-1 min-w-0 gap-0.5 text-sm font-bold text-primary text-start">
                  <Icon src="chevronBackward" size="xs" colour="primary"/>
                  <span className="truncate">{backLabel}</span>
                </button>
              : <Dialog.Title className="flex-1 text-lg font-bold">使い方</Dialog.Title>
          }
          {
            !current &&
            <button
              type="button"
              aria-label={isSearching ? "検索を閉じる" : "検索"}
              aria-pressed={isSearching}
              onClick={() => { setIsSearching(s => !s); setQuery(""); }}
              className="flex items-center justify-center size-8">
              <Icon src="search" size="sm" colour={isSearching ? "primary" : "grey"}/>
            </button>
          }
          <Dialog.Close aria-label="閉じる" className="flex items-center justify-center size-8">
            <Icon src="clear" size="sm" colour="grey"/>
          </Dialog.Close>
        </header>
        {
          isSearching && !current &&
          <div className="flex-shrink-0 px-4 pb-2">
            <TextInput
              defaultValue={query}
              placeholder="やりたいことを探す"
              onContentChange={setQuery}
              search
              clearable
              maxLength={30}/>
          </div>
        }
        <div ref={scrollRef} className="flex-1 min-h-0 px-4 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {
            current
              ? <ArticleView article={current} reader={reader} onOpen={openArticle}/>
              : isSearching
                ? <SearchView query={query} onOpen={openArticle} trouble={contents.groups.find(g => g.group === "trouble")?.articles ?? []}/>
                : <div className="space-y-2.5">
                    {
                      !hasSeen &&
                      <button
                        type="button"
                        onClick={() => openArticle(contents.walkthrough.id)}
                        className="flex items-center w-full gap-2.5 p-2.5 border rounded-lg border-primary text-start">
                        <BeginnerMark className="size-6"/>
                        <span className="flex-1">
                          <span className="block font-bold">はじめての方へ</span>
                          <span className="block text-sm text-muted">{contents.walkthrough.title}</span>
                        </span>
                        <Icon src="chevronForward" size="xs" colour="grey"/>
                      </button>
                    }
                    {
                      contents.groups.map(g =>
                        <div key={g.group} ref={el => { groupRefs.current[g.group] = el; }} className="scroll-mt-1">
                          <ExpandableSection
                            level={1}
                            title={HELP_GROUPS[g.group].title}
                            titleExtra={<Tag compact type="grey" text={`${g.articles.length}件`}/>}
                            expanded={!!expanded[g.group]}
                            onExpandedChange={(v) => setExpanded(e => ({ ...e, [g.group]: v }))}>
                            <ArticleRows articles={g.articles} onOpen={openArticle}/>
                          </ExpandableSection>
                        </div>
                      )
                    }
                    {
                      contents.others.length > 0 &&
                      <ExpandableSection
                        level={1}
                        title="ほかの役割の方向け"
                        titleExtra={<Tag compact type="grey" text={`${contents.others.length}件`}/>}
                        expanded={!!expanded.others}
                        onExpandedChange={(v) => setExpanded(e => ({ ...e, others: v }))}>
                        <ArticleRows articles={contents.others} onOpen={openArticle} showRoles/>
                      </ExpandableSection>
                    }
                  </div>
          }
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

function ArticleRows({ articles, onOpen, showRoles }: { articles: HelpArticle[], onOpen: (id: string) => void, showRoles?: boolean }) {
  return <ul className="border border-t-0 rounded-b-lg border-subtle">
    {
      articles.map((a, i) =>
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onOpen(a.id)}
            className={classNames("flex items-center w-full gap-2 px-2.5 py-2.5 text-start lg:hover:bg-subtle", { "border-t border-subtle": i > 0 })}>
            {a.type === "walkthrough" && <BeginnerMark className="size-4"/>}
            <span className="flex-1 min-w-0">{a.title}</span>
            {showRoles && a.roles?.map(r => <Tag key={r} type={r === "solo" ? "grey" : "primary"} text={HELP_ROLE_LABELS[r]} compact/>)}
            <Icon src="chevronForward" size="xs" colour="grey"/>
          </button>
        </li>
      )
    }
  </ul>;
}

function SearchView({ query, onOpen, trouble }: { query: string, onOpen: (id: string) => void, trouble: HelpArticle[] }) {
  const { matches, near } = useMemo(() => searchHelp(query), [query]);
  if (query.trim().length === 0) {
    return <p className="py-6 text-center text-muted">やりたいことや、困っていることを入力してください。</p>;
  }
  if (matches.length > 0) {
    return <div className="space-y-2">
      <p className="text-sm text-muted">{matches.length}件</p>
      {
        matches.map(a =>
          <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="block w-full p-2.5 border rounded-lg border-subtle text-start lg:hover:bg-subtle">
            <span className="block text-xs text-muted">{HELP_GROUPS[a.group].title}</span>
            <span className="block font-bold">{a.title}</span>
            <span className="block text-sm text-muted line-clamp-2">{a.summary}</span>
          </button>
        )
      }
    </div>;
  }
  return <div className="space-y-2.5">
    <p className="pt-4 pb-1 text-center text-muted">「{query.trim()}」は見つかりませんでした。</p>
    {
      near.length > 0 &&
      <ExpandableSection level={1} title="近いもの" defaultExpanded>
        <ArticleRows articles={near} onOpen={onOpen}/>
      </ExpandableSection>
    }
    <ExpandableSection level={1} title={HELP_GROUPS.trouble.title} defaultExpanded>
      <ArticleRows articles={trouble} onOpen={onOpen}/>
    </ExpandableSection>
  </div>;
}

function ArticleView({ article, reader, onOpen }: { article: HelpArticle, reader: HelpReader, onOpen: (id: string) => void }) {
  const isOtherRole = !appliesTo(article, reader);
  return <article className="pb-4">
    {
      article.context &&
      <p className="flex items-center gap-1 text-xs text-muted">
        <Icon src={CONTEXT_ICONS[article.context]} size="2xs" colour="grey"/>
        {HELP_CONTEXTS[article.context]}
      </p>
    }
    <h2 className="flex items-center gap-2 mt-0.5 text-xl font-bold leading-snug">
      {article.type === "walkthrough" && <BeginnerMark className="size-6"/>}
      {article.title}
    </h2>
    {
      isOtherRole && article.roles &&
      <div className="flex gap-1 mt-1.5">
        {article.roles.map(r => <Tag key={r} type={r === "solo" ? "grey" : "primary"} text={HELP_ROLE_LABELS[r]} compact/>)}
      </div>
    }
    <p className="my-3 border-l-[3px] border-primary pl-2.5 font-bold leading-relaxed">{article.summary}</p>
    {
      article.diagram &&
      <div className="mb-3 overflow-hidden border rounded-lg border-subtle">{article.diagram}</div>
    }
    {
      article.steps &&
      <ol className="space-y-2">
        {
          article.steps.map((s, i) =>
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span className="flex items-center justify-center flex-none mt-0.5 text-xs font-bold text-white rounded-full size-5 bg-primary-fill">{i + 1}</span>
              <span className="flex-1">{s}</span>
            </li>
          )
        }
      </ol>
    }
    {
      article.points &&
      <ul className={classNames("pl-5 space-y-1.5 leading-relaxed list-disc marker:text-primary", { "mt-3": article.steps })}>
        {article.points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    }
    {
      article.stages &&
      <ol>
        {
          article.stages.map((s, i) =>
            <li key={s.article} className="flex gap-2.5">
              <span className="flex flex-col items-center">
                <span className="flex items-center justify-center flex-none text-xs font-bold text-white rounded-full size-6 bg-primary-fill">{i + 1}</span>
                {i < article.stages!.length - 1 && <span className="flex-1 my-0.5 border-l-2 border-dashed border-primary"/>}
              </span>
              <button type="button" onClick={() => onOpen(s.article)} className="flex items-start flex-1 gap-2 pb-3 text-start">
                <span className="flex-1">
                  <span className="block font-bold">{s.title}</span>
                  <span className="block text-sm text-muted">{s.text}</span>
                </span>
                <Icon src="chevronForward" size="xs" colour="grey"/>
              </button>
            </li>
          )
        }
      </ol>
    }
    {
      article.related && article.related.length > 0 &&
      <Related ids={article.related} onOpen={onOpen}/>
    }
  </article>;
}

function Related({ ids, onOpen }: { ids: string[], onOpen: (id: string) => void }): ReactNode {
  const articles = ids.map(id => HELP_ARTICLES_BY_ID[id]).filter(Boolean);
  return <div className="pt-2 mt-4 border-t border-subtle">
    <p className="mb-0.5 text-xs font-bold text-muted">関連</p>
    {
      articles.map(a =>
        <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="flex items-center w-full gap-1 py-1.5 font-semibold text-primary text-start">
          <Icon src="chevronForward" size="xs" colour="primary"/>
          {a.title}
        </button>
      )
    }
  </div>;
}
