import { Input } from "@workspace/ui/components/input"

export function CentimeterInput({
  label,
  min,
  onChange,
  value,
}: {
  label: string
  min?: number
  onChange: (value: string) => void
  value: number
}) {
  return (
    <NumberInput
      label={label}
      min={min}
      suffix="cm"
      value={value}
      onChange={onChange}
    />
  )
}

export function NumberInput({
  label,
  min,
  onChange,
  step = 1,
  suffix,
  value,
}: {
  label: string
  min?: number
  onChange: (value: string) => void
  step?: number
  suffix: string
  value: number
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
        <Input
          className="border-0 px-0 shadow-none focus-visible:ring-0"
          inputMode="decimal"
          min={min}
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  )
}
