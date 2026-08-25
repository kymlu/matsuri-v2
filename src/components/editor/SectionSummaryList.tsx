import classNames from "classnames";
import { useEffect, useRef } from "react";
import { StageGeometry } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { Dancer } from "../../models/dancer";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import { Tag } from "../common/Tag";
import Icon from "../basic/Icon";
import { DancerPositionText } from "./PositionHint";

type SectionSummaryListProps = {
  dancer: Dancer;
  sections: ChoreoSection[];
  currentSectionId: string;
  geometry: StageGeometry;
  onChangeSection: (section: ChoreoSection) => void;
};

export default function SectionSummaryList({
  dancer,
  sections,
  currentSectionId,
  geometry,
  onChangeSection,
}: SectionSummaryListProps) {
  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    rowRefs.current.get(currentSectionId)?.scrollIntoView({behavior: "instant", block: "center"});
  }, []);

  return (
    <div className="flex flex-col w-full gap-2 pb-5">
      {
        sections.map(section => {
          const isActive = strEquals(currentSectionId, section.id);
          const position = section.formation.dancerPositions[dancer.id];
          const hasPublicNote = !isNullOrUndefinedOrBlank(section.note);

          return (
            <div
              key={section.id}
              ref={(el) => { rowRefs.current.set(section.id, el); }}
              onClick={() => onChangeSection(section)}
              className={classNames(
                "flex flex-col w-full gap-1 p-2 rounded-md cursor-pointer bg-transparent",
                {
                  "border-2 border-primary": isActive,
                  "border border-gray-400": !isActive,
                }
              )}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <div className="flex items-center min-w-0 gap-1">
                  <span className={classNames("truncate", {"text-primary font-bold": isActive, "font-semibold": !isActive})}>
                    {section.name}
                  </span>
                  {isActive && <Tag type="filled" text="現在" compact/>}
                </div>
                {hasPublicNote && <Icon src="speakerNotes" size="xs" colour="grey"/>}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {
                  position ?
                  <DancerPositionText position={position} geometry={geometry} bold={isActive}/> :
                  <span className="text-sm text-gray-500">-</span>
                }
                {
                  section.formation.dancerActions.map(action => {
                    const count = action.timings.find(t => t.dancerIds.includes(dancer.id))?.name;

                    return (
                      <Tag
                        key={action.id}
                        type="grey"
                        compact
                        text={<><span className="font-normal">{action.name}:</span> <span className="font-black">{count ?? "-"}</span></>}
                      />
                    );
                  })
                }
              </div>
            </div>
          );
        })
      }
    </div>
  );
}
