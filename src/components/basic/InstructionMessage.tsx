import IconButton from "./IconButton"

type InstructionMessageProps = {
  instruction: React.ReactNode,
  onClose: () => void,
}

export default function InstructionMessage({
  instruction, onClose
}: InstructionMessageProps) {
  return <div className="absolute items-center w-max rounded-md flex gap-2 p-2 top-24 left-1/2 translate-x-[-50%] bg-surface border border-primary">
    <span>
      {instruction}
    </span>
    <IconButton
      src="clear"
      size="sm"
      onClick={onClose}/>
  </div>
}