export default function Icon (props: {
  src: string,
  alt: string,
}) {
  return <img
    src={props.src}
    alt={props.alt}
    className="w-8 h-8"
    />
}