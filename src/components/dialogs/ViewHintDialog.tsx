import Icon from "../basic/Icon";
import BaseEditDialog from "./BaseEditDialog";

// register: no 自分 yet; notFound: 自分 isn't in this 隊列表; general: signed in without a name.
export type ViewHint = "register" | "notFound" | "general";

const TITLE: Record<ViewHint, string> = { register: "自分を登録しましょう", notFound: "名前が見つかりません", general: "使い方" };
const TEXT = {
  register: "自分の名前を選ぶと、次からは開いたときに自分の位置とカウントが表示されます。",
  general: "探して選ぶと、位置とカウントが表示されます。",
};

type ViewHintDialogProps = {
  hint: ViewHint,
  myDancerName: string | null,
  onSearch: () => void,
  onClose: () => void,
}

// The viewer's first-open hint, with 探す opening the find dialog.
export default function ViewHintDialog({ hint, myDancerName, onSearch, onClose }: ViewHintDialogProps) {
  return <BaseEditDialog title={TITLE[hint]} actionButtonText="探す" onClose={onClose} onSubmit={onSearch}>
    <p>
      {
        hint === "notFound"
          ? <><span className="break-all">「{myDancerName?.trim()}」</span>はこの隊列表にいません。別の名前の場合は、探して選んでください。</>
          : TEXT[hint]
      }
    </p>
    <p className="flex items-start gap-1 mt-2 text-sm text-muted">
      <Icon src="touchApp" size="xs" colour="grey"/>名前をタップしても位置を確認できます。
    </p>
  </BaseEditDialog>;
}
