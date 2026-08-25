import { StageGeometry } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { Dancer, DancerPosition } from "../../models/dancer";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction";
import PositionHint from "./PositionHint";
import SectionSummaryList from "./SectionSummaryList";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import Divider from "../basic/Divider";
import Button from "../basic/Button";
import React, { ReactNode, useState } from "react";
import BottomDrawer from "../basic/BottomDrawer";
import LongTextInput from "../inputs/LongTextInput";

type ViewerSidebarMode = "detail" | "list";

type ViewerSidebarProps = {
  note?: string;
  personalNote?: string;
  onPersonalNoteChange: (newNote: string) => void;
  sectionId: string;
  sections: ChoreoSection[];
  onChangeSection: (section: ChoreoSection) => void;
  dancer: Dancer;
  position: DancerPosition;
  nextPosition?: DancerPosition;
  selectedTiming?: string;
  onSelectTiming: (timing?: DancerActionTiming) => void;
  actions?: DancerAction[];
  geometry: StageGeometry;
  isPositionHintShown: boolean;
  deselectPosition: () => void;
  formationSelectionToolbar: ReactNode,
  onChangeHeight: (height: number) => void,
};

export default function ViewerSidebar({
  note,
  personalNote,
  onPersonalNoteChange,
  sectionId,
  sections,
  onChangeSection,
  dancer,
  position,
  nextPosition,
  selectedTiming,
  onSelectTiming,
  actions,
  geometry,
  isPositionHintShown,
  deselectPosition,
  formationSelectionToolbar,
  onChangeHeight,
}: ViewerSidebarProps) {
  const [mode, setMode] = useState<ViewerSidebarMode>("detail");
  const isListMode = isPositionHintShown && mode === "list";

  return <BottomDrawer
    header={
      <div className="flex items-center self-end justify-between w-full mb-2">
        <span className="h-8 text-base font-bold truncate">
          {isPositionHintShown ? dancer.name : "詳細"}
        </span>
        {
          (isPositionHintShown || selectedTiming) && <IconButton
            size="sm"
            src="clear"
            noBorder
            onClick={() => {
              if (isPositionHintShown) {
                deselectPosition();
                setMode("detail");
              } else if (selectedTiming) {
                onSelectTiming();
              }
            }}
          />
        }
      </div>
    }
    footer={
      <>
      <Divider medium/>
        {
          (!isPositionHintShown || mode === "detail") &&
          formationSelectionToolbar
        }
        {
          isPositionHintShown &&
          <div className="flex w-full gap-1 px-2 pt-1">
            <Button full compact primary={mode === "detail"} onClick={() => setMode("detail")}>
              詳細
            </Button>
            <Button full compact primary={mode === "list"} onClick={() => setMode("list")}>
              まとめ
            </Button>
          </div>
        }
      </>
    }
    onChangeHeight={(height) => onChangeHeight(height)}>
    <>
      {
        isListMode &&
        <SectionSummaryList
          dancer={dancer}
          sections={sections}
          currentSectionId={sectionId}
          geometry={geometry}
          onChangeSection={onChangeSection}
        />
      }
      {
        !isListMode &&
        <>
          {
            isPositionHintShown &&
            <PositionHint
              dancer={dancer}
              position={position}
              nextPosition={nextPosition}
              actions={actions}
              geometry={geometry}
            />
          }
          {
            isPositionHintShown &&
            <Divider/>
          }
          {
            actions && actions.length > 0 && !isPositionHintShown &&
            <div className="grid grid-cols-[2fr,5fr] items-start gap-2">
              {
                actions.map(action =>
                  <React.Fragment key={action.id}>
                    <span className="mt-1">
                      {action.name}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {
                        action.timings.map(timing =>
                          <Button
                            key={timing.id}
                            disabled={timing.dancerIds.length === 0}
                            primary={strEquals(selectedTiming, timing.id)}
                            compact
                            onClick={() => onSelectTiming(strEquals(selectedTiming, timing.id) ? undefined : timing)}
                            >
                            <div className="min-w-6 w-max">
                              {timing.name}
                            </div>
                          </Button>
                        )
                      }
                    </div>
                  </React.Fragment>
                )
              }
            </div>
          }
          {
            actions && actions.length > 0 && !isPositionHintShown &&
            <Divider/>
          }
          <div className="flex items-center gap-1 mb-1">
            <Icon src="globe" size="xs" colour="grey"/>
            <span className="text-sm text-gray-600">公開メモ</span>
          </div>
          {
            isNullOrUndefinedOrBlank(note) &&
            <p className="italic text-gray-500 break-words whitespace-pre-line text-wrap">
              メモなし
            </p>
          }
          {
            !isNullOrUndefinedOrBlank(note) &&
            <p className="break-words whitespace-pre-line text-wrap">
              {note}
            </p>
          }
          <Divider/>
          <div className="flex items-center gap-1 mb-1">
            <Icon src="lock" size="xs" colour="grey"/>
            <span className="text-sm text-gray-600">自分用メモ</span>
            <span className="ml-auto text-xs text-gray-400">この端末にのみ保存</span>
          </div>
          <div className="pb-2">
            <LongTextInput
              key={sectionId}
              name="自分用メモ"
              defaultValue={personalNote ?? ""}
              onContentChange={onPersonalNoteChange}
              placeholder="自分用メモを追加..."
              maxRows={2}
              compact/>
          </div>
        </>
      }
    </>
  </BottomDrawer>
}
