import { DrawerPreview as Drawer } from "@base-ui/react"
import { ReactNode, useEffect, useState } from "react"

type BottomDrawerProps = {
  children: ReactNode,
  header: ReactNode,
  footer: ReactNode,
}

export default function BottomDrawer ({
  children, header, footer
}: BottomDrawerProps) {
  const [open, setOpen] = useState(true);
  
  useEffect(() => {
    if (!open) {
      setOpen(true);
    }
  }, [open]);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(open: boolean) => { setOpen(open); }}
      defaultSnapPoint={"84px"}
      snapPoints={["84px", 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]}
      swipeDirection="down"
      modal={false}
      disablePointerDismissal={true}
      snapToSequentialPoints
      >
      <Drawer.Portal>
        <Drawer.Viewport className="fixed bottom-0 flex flex-col w-full pointer-events-none">
          <Drawer.Popup className="pointer-events-auto w-full h-[75svh] bg-white rounded-t-2xl overscroll-contain transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_-2px_16px_rgba(0,0,0,0.15)] [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]
            will-change-transform data-[data-swiping]:select-none data-[starting-style]:translate-y-[calc(100%-var(--bleed))] data-[ending-style]:translate-y-[calc(100%-var(--bleed))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]">
            <div className="flex-shrink-0 pt-6 pb-4 touch-none">
              <div className="w-1/3 h-1 mx-auto rounded-full bg-primary cursor-grab"/>
            </div>
            <Drawer.Content className="px-4 pb-6">
              {header}
              {children}
            </Drawer.Content>
          </Drawer.Popup>
          <div className="z-50 pb-6 bg-white pointer-events-auto">
            {footer}
          </div>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}