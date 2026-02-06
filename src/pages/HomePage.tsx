import { Dialog } from "@base-ui/react"
import CustomDialog from "../components/basic/CustomDialog"
import Divider from "../components/basic/Divider"
import { ICON, LAST_UPDATED } from "../lib/consts/consts"
import { IconLabelButton } from "../components/basic/Button"
import Icon from "../components/basic/Icon"
import { readUploadedFile } from "../lib/helpers/uploadHelper"
import { useEffect, useState } from "react"
import { getAllChoreos, saveChoreo } from "../lib/dataAccess/DataController"
import { Choreo, ChoreoSchema } from "../models/choreo"
import { groupByKey, strCompare, strEquals } from "../lib/helpers/globalHelper"
import { downloadLogs } from "../lib/helpers/logHelper"
import { getDate } from "../lib/helpers/dateHelper"
import IconButton from "../components/basic/IconButton"
import SampleStage from "../lib/samples/SampleStageFormation.json"
import SampleParade from "../lib/samples/SampleParadeFormation.json"
import z from "zod"

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
      if(!choreos.find(c => strEquals(c.id, SampleStage.id))) {
        choreos.push(z.parse(ChoreoSchema, SampleStage));
      }
      if(!choreos.find(c => strEquals(c.id, SampleParade.id))) {
        choreos.push(z.parse(ChoreoSchema, SampleParade));
      }
      setSavedChoreos(groupChoreos(choreos));
    });
  }, []);

  const groupChoreos = (choreos: Choreo[]) => {
    return groupByKey(
      choreos.sort((a, b) => {
        const eventCmp = strCompare<Choreo>(a, b, "event");
        if (eventCmp !== 0) return eventCmp;

        const dateA = a.lastUpdated ? new Date(a.lastUpdated)?.getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated)?.getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;

        return strCompare<Choreo>(a, b, "name");
      }),
      "event"
    )
  }

  const duplicateChoreo = (choreo: Choreo) => {
    const newChoreo = {
      ...choreo,
      id: crypto.randomUUID(),
      name: `${choreo.name}のコピー`,
      lastUpdated: new Date().toISOString(),
    } as Choreo;
    saveChoreo(newChoreo, () => {
      setSavedChoreos(prev => groupChoreos([...Object.values(prev).flat(), newChoreo]));
    });
  }

  return (
    <div className='flex flex-col w-full gap-2 mx-auto my-10'>
      <div className='flex items-center justify-between mx-4'>
        <h1 className='text-2xl font-bold'>祭り</h1>
      </div>
      <Divider primary/>
      <div className='flex flex-col gap-4 mx-5'>
        <div className="flex gap-2">
          <IconLabelButton
            full
            label="隊列表追加"
            icon={ICON.add}
            onClick={props.goToNewChoreoPage}
            />
          <IconLabelButton
            full
            label="アップロード"
            icon={ICON.upload}
            onClick={triggerUpload}
            />
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
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  return <div className="space-y-2">
    <div className='flex flex-row items-center'>
      <IconButton
        src={isExpanded ? ICON.arrowDropDown : ICON.arrowRight}
        size="sm"
        colour="primary"
        noBorder
        onClick={() => setIsExpanded(prev => !prev)} />
      <h2 className='text-xl font-bold text-primary'>{props.eventName.length === 0 ? "イベント不明" : props.eventName}</h2>
    </div>
    {
      isExpanded && 
      <div className="flex flex-col gap-2 px-8 md:grid md:grid-cols-2">
        {
          props.choreos.map((choreo) =>
            <Dialog.Root key={choreo.id}>
              <Dialog.Trigger>
                <div className="flex flex-col justify-between h-full p-3 transition-colors border-2 rounded-md border-primary lg:hover:bg-gray-100">
                  {/* Title */}
                  <div className="text-lg font-medium text-left break-words text-wrap">
                    {choreo.name}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {choreo.lastUpdated ? (
                      <div className="flex items-center gap-1">
                        <Icon colour="grey" size="sm" src={ICON.history}/>{getDate(new Date(choreo.lastUpdated))}
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1">
                      <Icon
                        src={ICON.person}
                        colour="grey"
                        size="sm"
                      />
                      <span>{Object.keys(choreo.dancers).length}</span>
                    </div>
                  </div>
                </div>
              </Dialog.Trigger>
              <CustomDialog hasX title={choreo.name}>
                <div className="flex flex-col gap-2">
                  <IconLabelButton
                    icon={ICON.visibility}
                    label="閲覧"
                    onClick={() => props.goToViewPage(choreo)}
                    full />

                  <IconLabelButton
                    icon={ICON.edit}
                    label="編集"
                    onClick={() => props.goToEditPage(choreo)}
                    full />

                  <Dialog.Close>
                    <IconLabelButton
                      icon={ICON.fileCopy}
                      label="複製"
                      asDiv
                      onClick={() => props.duplicateChoreo(choreo)}
                      full />
                  </Dialog.Close>
                </div>
              </CustomDialog>
            </Dialog.Root>
          )
        }
      </div>
    }
  </div>
}