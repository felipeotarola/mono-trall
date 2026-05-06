import { Trash2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function ReferenceImage({
  label,
  onRemove,
  src,
}: {
  label: string
  onRemove: () => void
  src: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-md border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- Local object URLs and canvas captures are not remote optimized assets. */}
      <img src={src} alt={label} className="aspect-square w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 text-[10px] font-medium text-white">
        <span className="block truncate">{label}</span>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  )
}
