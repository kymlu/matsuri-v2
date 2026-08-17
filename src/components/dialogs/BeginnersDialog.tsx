import { useState } from "react";
import CustomDialog from "../basic/CustomDialog";
import Button from "../basic/Button";
import { getImgPath } from "../../lib/helpers/globalHelper";


export default function BeginnersDialog() {
  const [step, setStep] = useState<
    "home" |
    "view1" |
    "view2" |
    "dialog" |
    "pdf"
  >("home");
  
  return <CustomDialog
    title="はじめての方へ"
    hasX
    full
    >
      <div className="flex flex-col justify-center gap-2 text-center">
        <p>当アプリをご利用いただき誠にありがとうございます！♡</p>
        <p>アプリの使い方を確認されたい場合は、下記のスクリーンショットを参考にしてください。</p>
        <p>
          <small className="text-primary">見た目はスクリーンショットと異なる場合がありますが、基本機能は同じです。</small>
        </p>
        <div className="flex items-center w-full gap-2 px-1 m-auto overflow-auto text-nowrap">
          <Button primary={step === "home"} onClick={() => setStep("home")}>ホーム</Button>
          <Button primary={step === "view1"} onClick={() => setStep("view1")}>閲覧モード１</Button>
          <Button primary={step === "view2"} onClick={() => setStep("view2")}>閲覧モード２</Button>
          <Button primary={step === "dialog"} onClick={() => setStep("dialog")}>エクスポート</Button>
          <Button primary={step === "pdf"} onClick={() => setStep("pdf")}>PDF</Button>
        </div>
        <img alt={step} src={getImgPath(step)}/>
      </div>
  </CustomDialog>
}