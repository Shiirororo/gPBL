"use client"

import { Group, Panel, Separator } from "react-resizable-panels"
import type { GroupProps, PanelProps, SeparatorProps } from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn("h-full w-full", className)}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: PanelProps) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: SeparatorProps & { withHandle?: boolean }) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        // vertical separator (default, for horizontal panel groups)
        "relative flex w-1.5 cursor-col-resize items-center justify-center",
        "bg-border/40 hover:bg-border transition-colors",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden",
        // horizontal separator (for vertical panel groups)
        "data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:cursor-row-resize",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-1 shrink-0 rounded-full bg-border" />
      )}
    </Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
