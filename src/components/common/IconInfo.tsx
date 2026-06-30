import { ICON } from "../../lib/consts/consts"
import Icon from "../basic/Icon"

function IconInfo(props: {icon: keyof typeof ICON, text: string}) {
  return <div className="flex items-center gap-0.5 text-gray-600">
    <Icon
      src={props.icon}
      colour="grey"
      size="xs"
    />
    <span>{props.text}</span>
  </div>
}

export function StageSize(props: {stageLength: number, stageWidth: number}) {
  return <IconInfo icon="resize" text={`${props.stageLength}m×${props.stageWidth}m`}/>
}

export function DancerCount(props: {dancerCount: number}) {
  return <IconInfo icon="group" text={props.dancerCount.toString()}/>
}

export function PropCount(props: {propCount: number}) {
  return <IconInfo icon="flag" text={props.propCount.toString()}/>
}