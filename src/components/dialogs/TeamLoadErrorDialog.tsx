import Button from "../basic/Button";
import CustomDialog from "../basic/CustomDialog";

export type TeamLoadError = "notFound" | "connection";

type TeamLoadErrorDialogProps = {
  error: TeamLoadError,
  teamSlug: string,
  onRetry: () => void,
  onUseWithoutTeam: () => void,
}

// Shown when the team in the URL can't be loaded, instead of quietly switching to the no-team version.
export default function TeamLoadErrorDialog({
  error, teamSlug, onRetry, onUseWithoutTeam
}: TeamLoadErrorDialogProps) {
  const notFound = error === "notFound";
  return <CustomDialog
    title={notFound ? "チームが見つかりません" : "接続できませんでした"}
    fullWidth
    focusDialogOnOpen
    footer={
      <div className="grid w-full grid-flow-col gap-2 mt-4 auto-cols-fr">
        <Button full primary={notFound} onClick={onUseWithoutTeam}>
          <span className="font-semibold text-nowrap">チームなしで使う</span>
        </Button>
        {
          // Retrying won't make a missing team appear.
          !notFound &&
          <Button full primary onClick={onRetry}>
            <span className="font-semibold text-nowrap">もう一度試す</span>
          </Button>
        }
      </div>
    }>
    {
      notFound
        ? <>
            <p>「{teamSlug}」というチームは見つかりませんでした。</p>
            <p>URLが正しいかご確認ください。</p>
          </>
        : <>
            <p>チーム情報を読み込めませんでした。</p>
            <p>通信環境をご確認のうえ、もう一度お試しください。</p>
          </>
    }
  </CustomDialog>
}
