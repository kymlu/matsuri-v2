import { DrawerPreview as Drawer } from "@base-ui/react"
import { ReactNode, useEffect, useRef, useState } from "react"

type BottomDrawerProps = {
  children: ReactNode,
  header: ReactNode,
  footer: ReactNode,
  // The active snap point as a fraction of the screen (0 at the smallest).
  onChangeHeight?: (height: number) => void,
  // Makes the drawer closable: swiping past the smallest snap point or a BottomDrawerClose slides it away, then this runs.
  onClose?: () => void,
  snapPoints?: Drawer.Root.SnapPoint[],
  defaultSnapPoint?: Drawer.Root.SnapPoint,
  popupClassName?: string,
  // Pixels covered from the bottom of the screen, each time the drawer settles (opened or snapped).
  onVisibleHeightChange?: (height: number) => void,
  label?: string,
  layerClassName?: string,
}

const DEFAULT_SNAP_POINTS: Drawer.Root.SnapPoint[] =
  ["75px", 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];

// Closes the drawer it is inside (with the slide), like Dialog.Close.
export const BottomDrawerClose = Drawer.Close;

export default function BottomDrawer ({
  children, header, footer, onChangeHeight,
  onClose, snapPoints = DEFAULT_SNAP_POINTS, defaultSnapPoint = 0.2,
  popupClassName = "h-[75svh]", onVisibleHeightChange, label, layerClassName = "",
}: BottomDrawerProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open && !onClose) {
      setOpen(true);
    }
  }, [open, onClose]);

  const popupRef = useRef<HTMLDivElement>(null);
  const reportVisibleHeight = () => {
    const popup = popupRef.current;
    if (popup && !popup.hasAttribute("data-swiping")) {
      onVisibleHeightChange?.(Math.round(window.innerHeight - popup.getBoundingClientRect().top));
    }
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(open: boolean) => { setOpen(open); }}
      onOpenChangeComplete={(open: boolean) => { if (open) reportVisibleHeight(); else onClose?.(); }}
      defaultSnapPoint={defaultSnapPoint}
      snapPoints={snapPoints}
      onSnapPointChange={(snapPoint) => {
        if (snapPoint) {
          if (snapPoint === snapPoints[0]) {
            onChangeHeight?.(0)
          } else {
            onChangeHeight?.(parseFloat(snapPoint?.toString()));
          }
        }
    }}
      swipeDirection="down"
      modal={false}
      disablePointerDismissal={true}
      snapToSequentialPoints
      >
      <Drawer.Portal>
        <Drawer.Viewport className={`fixed bottom-0 flex flex-col w-full pointer-events-none ${layerClassName}`}>
          <Drawer.Popup ref={popupRef} data-bottom-drawer aria-label={label}
            onTransitionEnd={(e) => { if (e.target === e.currentTarget && e.propertyName === "transform") reportVisibleHeight(); }}
            className={`pointer-events-auto w-full ${popupClassName} bg-surface rounded-t-2xl overscroll-contain transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_-2px_16px_rgba(0,0,0,0.15)] [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]
            will-change-transform outline-none data-[swiping]:select-none data-[starting-style]:translate-y-[calc(100%-var(--bleed))] data-[ending-style]:translate-y-[calc(100%-var(--bleed))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]`}>
            <div className="flex-shrink-0 pt-5 pb-3 touch-none">
              <div className="w-1/3 h-1 mx-auto rounded-full bg-primary cursor-grab"/>
            </div>
            <Drawer.Content className="h-full px-4 pb-6">
              {header}
              <div className="max-h-[calc(var(--drawer-frontmost-height)_-_var(--drawer-snap-point-offset)_-_75px)] overflow-auto">
                {children}
              </div>
            </Drawer.Content>
          </Drawer.Popup>
          <div className="z-50 pb-6 bg-surface pointer-events-auto"
            onTouchStart={(e) => e.stopPropagation()}>
            {footer}
          </div>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
