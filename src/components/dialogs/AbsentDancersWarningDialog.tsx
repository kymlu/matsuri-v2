import BaseErrorDialog from "./BaseErrorDialog";

type AbsentDancersWarningDialog = {
  choreoName?: string,
  eventName?: string,
  dancerNames?: string[],
}

export default function AbsentDancersWarningDialog({
  choreoName, eventName, dancerNames
}: AbsentDancersWarningDialog) {
  return <BaseErrorDialog title="ダンサー確認">
    <p className="max-w-full w-[100svw]"><b>「{eventName}」</b>の他の隊列にいますが、<b>「{choreoName}」</b>に含まれていないダンサーがいます。</p>
    <div className="flex flex-wrap justify-center gap-2 mt-2 overflow-y-auto max-h-52">
      {
        dancerNames?.sort().map(name =>
        <div
          key={name}
          className="bg-primary/10 px-2 py-0.5 min-w-10 text-center rounded-md">
          {name}
        </div>)
      }
    </div>
  </BaseErrorDialog>
}