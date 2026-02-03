import { Dialog } from "@base-ui/react"
import CustomDialog from "../components/basic/CustomDialog"
import Divider from "../components/basic/Divider"
import { ICON, LAST_UPDATED } from "../lib/consts/consts"
import { ActionButton } from "../components/basic/Button"
import Icon from "../components/basic/Icon"
import { readUploadedFile } from "../lib/helpers/uploadHelper"
import { useEffect, useState } from "react"
import { getAllChoreos } from "../lib/dataAccess/DataController"
import { Choreo } from "../models/choreo"
import { groupByKey, strCompare } from "../lib/helpers/globalHelper"
import { downloadLogs } from "../lib/helpers/logHelper"
import { getJpDate } from "../lib/helpers/dateHelper"

export default function HomePage(props: {
  goToNewChoreoPage: () => void,
  goToEditPage: (choreo: Choreo) => void,
  goToViewPage: (choreo: Choreo) => void,
  onUploadSuccess: (choreo: Choreo) => void,
}) {
  const [savedChoreos, setSavedChoreos] = useState<Record<string, Choreo[]>>({});

  const triggerUpload = () => {
    const uploadFileElement = document.getElementById("uploadFileInput");
    if (uploadFileElement){
      uploadFileElement.click();
    }
  }

  useEffect(() => {
    getAllChoreos().then((choreos) => {
      setSavedChoreos(
        groupByKey(
          choreos.sort((a, b) => {
            const eventCmp = strCompare<Choreo>(a, b, "event");
            if (eventCmp !== 0) return eventCmp;

            const dateA = a.lastUpdated?.getTime() ?? 0;
            const dateB = b.lastUpdated?.getTime() ?? 0;
            if (dateA !== dateB) return dateB - dateA;

            return strCompare<Choreo>(a, b, "name");
          }),
          "event"
        )
      );
    });
  }, []);

  const duplicateChoreo = (choreo: Choreo) => {
    const newChoreo = {
      ...choreo,
      id: crypto.randomUUID(),
      name: `${choreo.name}のコピー`,
    }
    props.goToEditPage(newChoreo);
  }

  return (
    <div className='flex flex-col w-full gap-2 mx-auto my-10'>
      <div className='flex items-center justify-between mx-4'>
        <h1 className='text-2xl font-bold'>祭り</h1>
      </div>
      <Divider primary/>
      <div className='flex flex-col gap-4 mx-5'>
        <div className="flex gap-4">
          <ActionButton
            full
            onClick={props.goToNewChoreoPage}>
            隊列表追加
          </ActionButton>
          <ActionButton
            full
            onClick={() => {
              triggerUpload();
            }}>
            アップロード
          </ActionButton>
        </div>
        {
          Object.entries(savedChoreos).map((group) =>
            <EventSection
              key={group[0]}
              eventName={group[0]}
              choreos={group[1]}
              goToEditPage={props.goToEditPage}
              goToViewPage={props.goToViewPage}
              duplicateChoreo={duplicateChoreo}
            />
          )
        }
        {/** Todo: show latest edited */}
        {/** Todo: get saved hardcoded files */}
      </div>
      <span onDoubleClick={downloadLogs} className='fixed opacity-50 bottom-2 left-2'>{LAST_UPDATED}</span>

      <input className='hidden' type="file" id="uploadFileInput" accept=".mtr"
        onChange={(event) => {
          console.log(event.target.files);
          if (event.target.files) {
            var file = event.target.files?.[0];
            readUploadedFile(
              file,
              (choreo: Choreo) => {props.onUploadSuccess(choreo);},
              () => {}
            );
          }
        }}/>
    </div>
  )
}

function EventSection(props: {
  eventName: string,
  choreos: Choreo[],
  goToViewPage: (choreo: Choreo) => void,
  goToEditPage: (choreo: Choreo) => void,
  duplicateChoreo: (choreo: Choreo) => void,
}) {
  return <div>
    <div className='flex flex-row items-end gap-2'>
      <h2 className='text-xl font-bold text-primary'>{props.eventName.length === 0 ? "イベント不明" : props.eventName}</h2>
    </div>
    <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
      {
        props.choreos.map((choreo) =>
          <Dialog.Root key={choreo.id}>
            <Dialog.Trigger>
              <div className="flex flex-col justify-center h-full p-3 transition-colors border-2 rounded-md border-primary lg:hover:bg-gray-100">
                <div className="font-medium">
                  {choreo.name}
                </div>

                {choreo.lastUpdated && (
                  <div className="mt-1 text-sm text-gray-500">
                    更新日：{getJpDate(choreo.lastUpdated)}
                  </div>
                )}
              </div>
            </Dialog.Trigger>
            <CustomDialog hasX title={choreo.name}>
              <div className="flex flex-col gap-2">
                <ActionButton full onClick={() => { props.goToViewPage(choreo); }}>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Icon src={ICON.visibilityBlack} alt="view"/>
                    閲覧
                  </div>
                </ActionButton>
                <ActionButton full onClick={() => { props.goToEditPage(choreo); }}>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Icon src={ICON.editBlack} alt="edit"/>
                    編集
                  </div>
                </ActionButton>
                <ActionButton full onClick={() => {props.duplicateChoreo(choreo)}}>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Icon src={ICON.fileCopy} alt="duplicate"/>
                    重複
                  </div>
                </ActionButton>
              </div>
            </CustomDialog>
          </Dialog.Root>
        )
      }
    </div>
  </div>
}