import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"

import data from "./data.json"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
    {/* Canvas / plan */}
    <section className="min-h-[720px] rounded-3xl border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Trallplan
          </h1>
          <p className="text-sm text-muted-foreground">
            Välj husmall, sätt skala och rita trallens form.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm">
            Välj hus
          </button>
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">
            Rita trall
          </button>
        </div>
      </div>

      <div className="relative h-[640px] overflow-hidden rounded-b-3xl bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px]">
        <svg viewBox="0 0 1000 640" className="h-full w-full">
          {/* house */}
          <rect
            x="250"
            y="140"
            width="360"
            height="220"
            rx="8"
            className="fill-muted stroke-foreground/40"
            strokeWidth="3"
          />

          {/* deck polygon */}
          <polygon
            points="210,360 650,360 720,520 180,520"
            className="fill-amber-500/25 stroke-amber-700"
            strokeWidth="4"
          />

          {/* polygon points */}
          {[
            [210, 360],
            [650, 360],
            [720, 520],
            [180, 520],
          ].map(([x, y], index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="10"
              className="fill-background stroke-amber-700"
              strokeWidth="4"
            />
          ))}

          {/* labels */}
          <text x="380" y="255" className="fill-foreground text-xl font-semibold">
            Hus
          </text>
          <text x="390" y="455" className="fill-amber-800 text-lg font-semibold">
            Trall
          </text>
        </svg>
      </div>
    </section>

    {/* Right panel */}
    <aside className="space-y-4">
      <div className="rounded-3xl border bg-background p-5 shadow-sm">
        <h2 className="font-semibold">Projekt</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Altan bakom huset
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Area" value="42.8 m²" />
          <Stat label="Omkrets" value="28.4 m" />
          <Stat label="Trall" value="356 lm" />
          <Stat label="Spill" value="10%" />
        </div>
      </div>

      <div className="rounded-3xl border bg-background p-5 shadow-sm">
        <h2 className="font-semibold">Material</h2>

        <div className="mt-4 space-y-3">
          <Row label="Trallbräda" value="28x120 mm" />
          <Row label="Pris/löpmeter" value="39 kr" />
          <Row label="Regelverk" value="45x145 mm" />
          <Row label="Skruv" value="1 250 st" />
        </div>
      </div>

      <div className="rounded-3xl border bg-primary p-5 text-primary-foreground shadow-sm">
        <p className="text-sm opacity-80">Estimerat materialpris</p>
        <p className="mt-2 text-3xl font-bold">18 940 kr</p>
        <button className="mt-5 w-full rounded-xl bg-background px-4 py-2 text-sm font-medium text-foreground">
          Skapa offert
        </button>
      </div>
    </aside>
  </div>
</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}