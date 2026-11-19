import { ICON } from "../../lib/consts/consts"
import Icon from "../basic/Icon"
import { formatStageSize } from "../../lib/helpers/stageGridHelper"
import { StageType } from "../../models/choreo"

function IconInfo(props: {icon: keyof typeof ICON, text: string}) {
  return <div className="flex items-center gap-0.5">
    <Icon
      src={props.icon}
      colour="grey"
      size="xs"
    />
    <span>{props.text}</span>
  </div>
}

export function StageSize(props: {stageLength: number, stageWidth: number, stageType?: StageType}) {
  return <IconInfo icon="resize" text={formatStageSize(props.stageWidth, props.stageLength, props.stageType)}/>
}

export function DancerCount(props: {dancerCount: number}) {
  return <IconInfo icon="group" text={`${props.dancerCount.toString()}人`}/>
}

export function PropCount(props: {propCount: number}) {
  return <IconInfo icon="flag" text={props.propCount.toString()}/>
}