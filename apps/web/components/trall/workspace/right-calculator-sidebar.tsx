import type { ReactNode } from "react"
import { PanelRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function RightCalculatorSidebar({
  children,
  onToggle,
  open,
}: {
  children: ReactNode
  onToggle: () => void
  open: boolean
}) {
  return (
    <>
      {!open ? (
        <CalculatorSidebarTrigger
          ariaLabel="Open calculator sidebar"
          className="fixed top-5 right-3 z-30 hidden lg:inline-flex xl:right-5"
          title="Open calculator sidebar"
          onClick={onToggle}
        />
      ) : null}
      <aside
        aria-hidden={!open}
        className={
          open
            ? "fixed inset-y-0 right-0 z-20 hidden w-[320px] translate-x-0 border-s border-stone-200 bg-white text-sidebar-foreground transition-transform duration-200 lg:flex xl:w-[360px]"
            : "pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-[320px] translate-x-full border-s border-stone-200 bg-white text-sidebar-foreground transition-transform duration-200 lg:flex xl:w-[360px]"
        }
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-stone-200 px-4 lg:px-5">
            <CalculatorSidebarTrigger
              ariaLabel="Close calculator sidebar"
              className="-ms-1"
              title="Close calculator sidebar"
              onClick={onToggle}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                Project calculator
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3.5">{children}</div>
        </div>
      </aside>
    </>
  )
}

function CalculatorSidebarTrigger({
  ariaLabel,
  className,
  onClick,
  title,
}: {
  ariaLabel: string
  className?: string
  onClick: () => void
  title: string
}) {
  return (
    <Button
      aria-label={ariaLabel}
      className={className}
      size="icon-sm"
      title={title}
      variant="ghost"
      onClick={onClick}
    >
      <PanelRightIcon />
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  )
}
