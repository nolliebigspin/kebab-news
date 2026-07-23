"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { useState } from "react";

type FramingTooltipProps = {
  label: string;
  note: string;
  children: string;
};

/**
 * Accessible framing explanation for mouse, keyboard and touch input.
 *
 * Hover and focus are handled by Base UI. The explicit click handler keeps
 * the popup available on touch devices until the reader taps elsewhere.
 */
export function FramingTooltip({ label, note, children }: FramingTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen} disableHoverablePopup={false}>
      <Tooltip.Trigger
        delay={250}
        closeDelay={100}
        closeOnClick={false}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="inline cursor-help rounded-sm bg-brand-wash px-0.5 text-left text-brand-ink underline decoration-brand-ink decoration-dotted underline-offset-2 outline-none hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8} collisionPadding={12} className="z-50">
          <Tooltip.Popup className="max-w-[min(20rem,calc(100vw-1.5rem))] origin-[var(--transform-origin)] rounded-lg border border-line bg-ink px-3 py-2 text-bg text-xs leading-5 shadow-xl transition-[transform,opacity] data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <span className="block font-semibold text-white">{label}</span>
            <span className="block text-white/85">{note}</span>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
