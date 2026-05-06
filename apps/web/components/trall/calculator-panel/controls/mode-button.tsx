import { Button } from "@workspace/ui/components/button"

export function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-pressed={active}
      className="h-8 px-2"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
