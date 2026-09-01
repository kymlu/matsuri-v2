import { useState } from "react";
import IconButton from "../components/basic/IconButton";
import CustomSelect from "../components/inputs/CustomSelect";
import ExpandableSection from "../components/basic/ExpandableSection";
import { HELP_CONTENT, HelpPageKey } from "../lib/content/helpContent";
import Divider from "../components/basic/Divider";

type HelpPageProps = {
  goToHomePage: () => void,
}

const PAGE_ITEMS: Record<string, string> = {
  home: "ホーム画面",
  concepts: "隊列表の基本",
  view: "閲覧モード",
  edit: "編集モード",
  exports: "エクスポート",
  team: "チームとログイン",
  admin: "ユーザー管理",
};

export default function HelpPage({
  goToHomePage
}: HelpPageProps) {
  const [referencedPage, setReferencedPage] = useState<HelpPageKey>("home");
  const content = HELP_CONTENT[referencedPage];

  return <div className="w-full px-4 grid grid-rows-[auto,auto,1fr] py-10 gap-4 text-center overflow-hide bg-app h-[100svh]">
    <header className="flex gap-2">
      <IconButton
        src="home"
        noBorder
        onClick={() => {
          goToHomePage();
        }}/>
      <h2 className="flex-1 text-2xl font-bold text-nowrap text-start">使い方ガイド</h2>
    </header>
    <div className="px-2">
      <CustomSelect
        items={PAGE_ITEMS}
        defaultValue="ホーム画面"
        setSelectValue={(newValue) => setReferencedPage(newValue as HelpPageKey)}
        />
    </div>
    <div className="px-2 space-y-2 overflow-y-auto text-start">
      <div className="text-muted">{content.overview}</div>
      {
        content.sections.map((section) => (
          <ExpandableSection key={section.id} title={section.title} level={2} defaultExpanded={false}>
            <div className="pl-2 space-y-2 text-muted text-start">
              {section.content}
              <Divider compact/>
            </div>
          </ExpandableSection>
        ))
      }
    </div>
  </div>;
}
