import { Dialog, Menu } from "@base-ui/react"
import CustomDialog from "../components/basic/CustomDialog"
import { ICON, LAST_UPDATED } from "../lib/consts/consts"
import { IconLabelButton } from "../components/basic/Button"
import Icon from "../components/basic/Icon"
import { readUploadedFile } from "../lib/helpers/uploadHelper"
import { useEffect, useState } from "react"
import { deleteChoreo, getAllChoreos, saveChoreo, saveChoreos } from "../lib/dataAccess/DataController"
import { Choreo, ChoreoSchema } from "../models/choreo"
import { groupByKey, strCompare, strEquals } from "../lib/helpers/globalHelper"
import { downloadLogs } from "../lib/helpers/logHelper"
import { getDate } from "../lib/helpers/dateHelper"
import IconButton from "../components/basic/IconButton"
import SampleStage from "../lib/samples/SampleStageFormation.json"
import SampleParade from "../lib/samples/SampleParadeFormation.json"
import z from "zod"
import { exportEvent, exportChoreo } from "../lib/helpers/exportHelper"
import BaseEditDialog from "../components/dialogs/BaseEditDialog"
import ConfirmUploadDialog from "../components/dialogs/ConfirmUploadDialog"
import BaseErrorDialog from "../components/dialogs/BaseErrorDialog"
import ExportDialog from "../components/dialogs/ExportDialog"
import React from "react"
import CustomMenu from "../components/inputs/CustomMenu"
import Divider from "../components/basic/Divider"
import EditNameDialog from "../components/dialogs/EditNameDialog"

type HomePageProps = {
  goToNewChoreoPage: (eventName?: string) => void,
  goToViewPage: (choreo: Choreo) => void,
}

export default function HomePage({
  goToNewChoreoPage,
  goToViewPage,
}: HomePageProps) {
  const [savedChoreos, setSavedChoreos] = useState<Record<string, Choreo[]>>({});
  
  const [editingChoreo, setEditingChoreo] = useState<Choreo | undefined>();
  const [editChoreoInfoDialogOpen, setEditChoreoInfoDialogOpen] = useState(false);
  const editChoreoInfoDialog = Dialog.createHandle<{}>();
  const handleEditChoreoInfoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditChoreoInfoDialogOpen(isOpen);
  };

  const [editingEventName, setEditingEventName] = useState<string | undefined>();
  const [editEventNameDialogOpen, setEventNameDialogOpen] = useState(false);
  const editEventNameDialog = Dialog.createHandle<{}>();
  const handleEventNameDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEventNameDialogOpen(isOpen);
  }

  const [deleteChoreoDialogOpen, setDeleteChoreoDialogOpen] = useState(false);
  const deleteChoreoDialog = Dialog.createHandle<{}>();
  const handleDeleteChoreoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDeleteChoreoDialogOpen(isOpen);
  };

  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>("");
  const [uploadFailedDialogOpen, setUploadFailedDialogOpen] = useState(false);
  const uploadFailedDialog = Dialog.createHandle<{}>();
  const handleUploadFailedDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadFailedDialogOpen(isOpen);
  };
  
  const [uploadSucceededDialogOpen, setUploadSucceededDialogOpen] = useState(false);
  const uploadSucceededDialog = Dialog.createHandle<{}>();
  const handleUploadSucceededDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadSucceededDialogOpen(isOpen);
  };

  const [exportingChoreo, setExportingChoreo] = useState<Choreo | undefined>();
  const [pdfExportDialogOpen, setPdfExportDialogOpen] = useState(false);
  const pdfExportDialog = Dialog.createHandle<{}>();
  const handlePdfExportDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setPdfExportDialogOpen(isOpen);
  };

  const [uploadedChoreo, setUploadedChoreo] = useState<Choreo | undefined>();
  const [duplicateChoreoId, setDuplicateChoreoId] = useState<string | undefined>();
  const [uploadChoreoDialogOpen, setUploadChoreoDialogOpen] = useState(false);
  const uploadChoreoDialog = Dialog.createHandle<{}>();
  const handleUploadChoreoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadChoreoDialogOpen(isOpen);
  };

  const triggerUpload = () => {
    const uploadFileElement = document.getElementById("uploadFileInput");
    if (uploadFileElement){
      uploadFileElement.click();
    }
  }

  useEffect(() => {
    loadChoreos();
  }, []);

  const loadChoreos = () => {
    getAllChoreos().then((choreos) => {
      if(!choreos.find(c => strEquals(c.id, SampleStage.id))) {
        choreos.push(z.parse(ChoreoSchema, SampleStage));
      }
      if(!choreos.find(c => strEquals(c.id, SampleParade.id))) {
        choreos.push(z.parse(ChoreoSchema, SampleParade));
      }
      setSavedChoreos(groupChoreos(choreos));
    });
  }

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
    <div className='grid grid-rows-[auto,auto,1fr] overflow-hide w-full gap-2 mx-auto py-10 px-6 h-[100svh]'>
      <h1 className='mx-4 text-2xl font-bold text-center'>隊列表作成</h1>
      <div className="flex gap-2 mb-2">
        <IconLabelButton
          full
          primary
          label="新規作成"
          icon={ICON.add}
          onClick={() => goToNewChoreoPage()}
          />
        <IconLabelButton
          full
          label="アップロード"
          icon={ICON.upload}
          onClick={triggerUpload}
          />
      </div>
      <div className="h-full space-y-4 overflow-scroll">
        {
          Object.entries(savedChoreos).map(([eventName, choreos]) =>
            <EventSection
              key={eventName}
              eventName={eventName}
              choreos={choreos}
              goToViewPage={goToViewPage}
              duplicateChoreo={duplicateChoreo}
              editChoreoName={(choreo) => {
                setEditingChoreo(choreo);
                setEditChoreoInfoDialogOpen(true);
              }}
              deleteChoreo={(choreo) => {
                setEditingChoreo(choreo);
                setDeleteChoreoDialogOpen(true);
              }}
              onPdfExport={(choreo) => {
                setExportingChoreo(choreo);
                setPdfExportDialogOpen(true);
              }}
              addEvent={() => {goToNewChoreoPage(eventName)}}
              editEventName={() => {
                setEditingEventName(eventName);
                setEventNameDialogOpen(true);
              }}
            />
          )
        }
      </div>
      <span onDoubleClick={downloadLogs} className='fixed opacity-50 bottom-2 left-2'>{LAST_UPDATED}</span>

      <input
        className='hidden'
        type="file"
        id="uploadFileInput"
        accept=".mtr, application/zip"
        onChange={(event) => {
          if (!event.target.files || event.target.files.length === 0) {
            console.log("No files were selected to upload.");              
          } else {
            var file = event.target.files?.[0];
            readUploadedFile(
              file,
              (newChoreo: Choreo) => {
                const existingChoreos = Object.values(savedChoreos).flat();
                const duplicateChoreo = existingChoreos.find(c => strEquals(c.name, newChoreo.name) && strEquals(c.event, newChoreo.event));
                if (duplicateChoreo) {
                  setDuplicateChoreoId(duplicateChoreo.id);
                  setUploadChoreoDialogOpen(true);
                  setUploadedChoreo(newChoreo);
                } else {
                  newChoreo.id = crypto.randomUUID();
                  saveChoreo(newChoreo, () => {goToViewPage(newChoreo)});
                }
              },
              (newChoreos: Choreo[], errorMessage?: string) => {
                if (newChoreos.length > 0) {
                  saveChoreos(
                    [...newChoreos.map((c) => ({...c, id: crypto.randomUUID()}))],
                    () => {
                      loadChoreos();
                      if (errorMessage) {
                        setUploadErrorMessage(errorMessage);
                        setUploadFailedDialogOpen(true);
                      } else {
                        setUploadSucceededDialogOpen(true);
                      }
                    }
                  );
                } else {
                  setUploadErrorMessage(errorMessage ?? "アップロードできませんでした。");
                  setUploadFailedDialogOpen(true);
                }
                event.target.value = "";
              },
              (e) => {
                setUploadErrorMessage(e);
                setUploadFailedDialogOpen(true);
                event.target.value = "";
              }
            );
          }
        }}/>
        <Dialog.Root
          handle={editChoreoInfoDialog}
          open={editChoreoInfoDialogOpen}
          onOpenChange={handleEditChoreoInfoDialogOpen}>
          <EditNameDialog
            name={editingChoreo?.name}
            type="隊列表"
            onClose={() => {setEditingChoreo(undefined)}}
            onSubmit={(name: string) => {
              if (editingChoreo) {
                saveChoreo({...editingChoreo, name}, () => {
                  editChoreoInfoDialog.close();
                  setEditChoreoInfoDialogOpen(false);
                  setEditingChoreo(undefined);
                  loadChoreos();
                });
              }
            }}
          />
        </Dialog.Root>
        <Dialog.Root
          handle={editEventNameDialog}
          open={editEventNameDialogOpen}
          onOpenChange={handleEventNameDialogOpen}>
            
          <EditNameDialog
            name={editingEventName}
            required={false}
            type="イベント"
            onClose={() => {setEditingEventName(undefined)}}
            onSubmit={(name) => {
              saveChoreos(
                savedChoreos[editingEventName ?? ""].map(c => {return {...c, event: name}}),
                () => {
                  setEventNameDialogOpen(false);
                  loadChoreos();
                }
              );
            }}/>
        </Dialog.Root>
        <Dialog.Root
          handle={pdfExportDialog}
          open={pdfExportDialogOpen}
          onOpenChange={handlePdfExportDialogOpen}>
            
          {
            exportingChoreo &&
            <ExportDialog
              choreo={exportingChoreo!}
              selectedId=""
              onClose={() => {
                setPdfExportDialogOpen(false);
                setExportingChoreo(undefined);
              }}
              />
          }
        </Dialog.Root>
        <Dialog.Root
          handle={deleteChoreoDialog}
          open={deleteChoreoDialogOpen}
          onOpenChange={handleDeleteChoreoDialogOpen}>
            
          <BaseEditDialog
            title={`本当に${editingChoreo?.name}を削除しますか？`}
            actionButtonText="OK"
            onSubmit={() => {
              if (editingChoreo) {
                deleteChoreo(editingChoreo.id, () => {
                  deleteChoreoDialog.close();
                  setDeleteChoreoDialogOpen(false);
                  setEditingChoreo(undefined);
                  loadChoreos();
                });
              }
            }}>
            この操作は取り消せません。
          </BaseEditDialog>
        </Dialog.Root>
        <Dialog.Root
          handle={uploadFailedDialog}
          open={uploadFailedDialogOpen}
          onOpenChange={handleUploadFailedDialogOpen}>
            
          <BaseErrorDialog
            title="アップロード失敗"
            onClose={() => {setUploadFailedDialogOpen(false)}}>
            <p className="break-words whitespace-pre-line text-wrap">{uploadErrorMessage}</p>
            <p>別のファイルをお試しください。</p>
          </BaseErrorDialog>
        </Dialog.Root>
        <Dialog.Root
          handle={uploadSucceededDialog}
          open={uploadSucceededDialogOpen}
          onOpenChange={handleUploadSucceededDialogOpen}>
            
          <BaseErrorDialog
            title="アップロード成功"
            onClose={() => {setUploadSucceededDialogOpen(false)}}>
            <p>全てのファイルをアップロードできました。</p>
          </BaseErrorDialog>
        </Dialog.Root>
        <Dialog.Root
          handle={uploadChoreoDialog}
          open={uploadChoreoDialogOpen}
          onOpenChange={handleUploadChoreoDialogOpen}
        >
          <ConfirmUploadDialog
            choreoName={uploadedChoreo?.name}
            event={uploadedChoreo?.event}
            onCancel={() => {
              setUploadChoreoDialogOpen(false);
              setUploadedChoreo(undefined);
            }}
            onCopy={() => {
              const newChoreo = {
                ...uploadedChoreo!,
                id: crypto.randomUUID(),
                name: `${uploadedChoreo!.name} - コピー`
              };
              saveChoreo(newChoreo, () => {goToViewPage(newChoreo)});
              setUploadedChoreo(undefined);
              setUploadChoreoDialogOpen(false);
            }}
            onOverwrite={() => {
              setUploadChoreoDialogOpen(false);
              const newChoreo = {
                ...uploadedChoreo!,
                id: duplicateChoreoId ?? crypto.randomUUID(),
              };
              saveChoreo(newChoreo, () => {goToViewPage(newChoreo)});
              setUploadedChoreo(undefined);
              setUploadChoreoDialogOpen(false);
            }}
          />
        </Dialog.Root>
    </div>
  )
}

type EventSectionProps = {
  eventName: string,
  choreos: Choreo[],
  addEvent: () => void,
  editEventName: () => void,
  goToViewPage: (choreo: Choreo) => void,
  duplicateChoreo: (choreo: Choreo) => void,
  editChoreoName: (choreo: Choreo) => void,
  deleteChoreo: (choreo: Choreo) => void,
  onPdfExport: (choreo: Choreo) => void,
}

function EventSection({
  eventName,choreos, goToViewPage, addEvent, editEventName,
  duplicateChoreo, editChoreoName, deleteChoreo, onPdfExport
}: EventSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const optionsDialog = Dialog.createHandle<Choreo>();
  const [optionsDialogOpen, setOptionsDialogOpen] = React.useState(false);
  const [selectedChoreo, setSelectedChoreo] = useState<Choreo | undefined>();

  const handleOptionsDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setOptionsDialogOpen(isOpen);
  };
  
  return <div className="pr-4 space-y-2">
    <div className="flex flex-row justify-between w-full">
      <button onClick={() => setIsExpanded(prev => !prev)} className='flex flex-row items-center w-full'>
        <IconButton
          src={isExpanded ? ICON.arrowDropDown : ICON.arrowRight}
          size="sm"
          colour="primary"
          noBorder
          asDiv />
        <h2 className='text-xl font-bold text-primary'>{eventName.length === 0 ? "イベント不明" : eventName}</h2>
      </button>
      <CustomMenu trigger={
        <IconButton
          src={ICON.moreVert}
          asDiv
          noBorder
          size="sm"
        />
      }>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.add} label="追加" onClick={addEvent}/>
        </Menu.Item>
        <Divider compact/>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.edit} label="名前変更" onClick={editEventName}/>
        </Menu.Item>
        <Divider compact/>
        <Menu.Item>
          <IconLabelButton full noBorder icon={ICON.download} label="共有" onClick={() => exportEvent(choreos, eventName)}/>
        </Menu.Item>
      </CustomMenu>
    </div>
    {
      isExpanded && 
      <div className="flex flex-col gap-2 px-8 md:grid md:grid-cols-2">
        {
          choreos.map((choreo) =>
            <React.Fragment key={choreo.id}>
              <div
                onClick={() => {goToViewPage(choreo)}}
                className="flex flex-col justify-between h-full p-3 transition-colors border-2 rounded-md cursor-pointer border-primary lg:hover:bg-gray-100">
                {/* Title */}
                <div className="flex flex-row items-start justify-between gap-2">
                  <span className="text-lg font-medium text-left break-words text-wrap">
                    {choreo.name}
                  </span>
                  <Dialog.Trigger id={choreo.id} payload={choreo} handle={optionsDialog} onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChoreo(choreo);
                    setOptionsDialogOpen(true);
                  }}>
                    <IconButton
                      src={ICON.moreVert}
                      size="sm"
                      noBorder
                      asDiv
                    />
                  </Dialog.Trigger>
                </div>
                {/* Meta row */}
                <div className="items-center justify-between text-sm text-gray-500 md:flex">
                  {choreo.lastUpdated ? (
                    <div className="flex items-center gap-1">
                      <Icon colour="grey" size="sm" src={ICON.history}/>{getDate(new Date(choreo.lastUpdated))}
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Icon
                        src={ICON.resize}
                        colour="grey"
                        size="sm"
                      />
                      <span>幅{choreo.stageGeometry.stageWidth}m 縦{choreo.stageGeometry.stageLength}m</span>
                    </div>

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
              </div> 
            </React.Fragment>
          )
        }
        <Dialog.Root
          open={optionsDialogOpen}
          onOpenChange={handleOptionsDialogOpenChange}
          handle={optionsDialog}>
          {
            selectedChoreo &&
            <CustomDialog hasX title={selectedChoreo.name}>
              <div className="flex flex-col gap-2">
                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.fileCopy}
                    label="複製"
                    asDiv
                    onClick={() => duplicateChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>

                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.textFieldsAlt}
                    label="名前編集"
                    asDiv
                    onClick={() => editChoreoName(selectedChoreo)}
                    full />
                </Dialog.Close>

                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.fileExport}
                    label="共有用エクスポート"
                    asDiv
                    onClick={() => exportChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>
                
                <Dialog.Close>
                  <IconLabelButton
                    icon={ICON.pictureAsPdf}
                    label="PDFをダウンロード"
                    asDiv
                    onClick={() => onPdfExport(selectedChoreo)}
                    full />
                </Dialog.Close>

                <Dialog.Close>
                  <IconLabelButton
                    primaryText
                    icon={ICON.delete}
                    label="削除"
                    asDiv
                    onClick={() => deleteChoreo(selectedChoreo)}
                    full />
                </Dialog.Close>
              </div>
            </CustomDialog>
          }
        </Dialog.Root>
      </div>
    }
  </div>
}