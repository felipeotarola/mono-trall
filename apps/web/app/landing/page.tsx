import Image from "next/image"
import Link from "next/link"
import {
  BadgeCheckIcon,
  BoxIcon,
  Code2Icon,
  ImagePlusIcon,
  Layers3Icon,
  MousePointer2Icon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"

const workflowSteps = [
  {
    title: "Draw the deck in 2D",
    description:
      "Plan accurate edges, dimensions, pool placement, stairs, fences, pergolas, planting, and house openings in the top-down editor.",
    image: "/trall/landing/planner.png",
    icon: MousePointer2Icon,
  },
  {
    title: "Inspect the build in 3D",
    description:
      "Orbit around the project to understand deck levels, sloped terrain, support posts, glass fencing, pool height, roof shape, and materials.",
    image: "/trall/landing/preview-3d.png",
    icon: BoxIcon,
  },
  {
    title: "Review with AI images",
    description:
      "Combine real property photos with the 3D model, open the generated render large, mark problem areas, and regenerate corrections.",
    image: "/trall/landing/ai-review.png",
    icon: SparklesIcon,
  },
]

const capabilities = [
  "2D precision deck planner",
  "3D terrain and elevation preview",
  "Pool, stairs, fences, pergolas, planting, and lighting",
  "House dimensions, roof styles, doors, and windows",
  "Materials and visual presets",
  "AI property renders from real reference photos",
  "Markup-based AI correction loop",
  "Saved project history and saved AI images",
]

export default function LandingPage() {
  return (
    <main className="min-h-svh bg-[#f5f4ef] text-zinc-950">
      <HeroSection />
      <section className="border-y bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProofItem
            icon={Layers3Icon}
            label="Planner first"
            value="2D stays source of truth"
          />
          <ProofItem icon={BoxIcon} label="Preview" value="Real 3D levels" />
          <ProofItem
            icon={ImagePlusIcon}
            label="AI"
            value="Reference photos + model"
          />
          <ProofItem
            icon={Code2Icon}
            label="Open source"
            value="Built to be shared"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            From measured plan to believable image
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            TrallAI turns a deck idea into something you can inspect, explain,
            and revise.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-650">
            The planner is built around a practical workflow: keep geometry
            precise in 2D, validate the build relationship in 3D, then use AI to
            communicate how the project could look on the real property.
          </p>
        </div>

        <div className="mt-10 grid gap-6">
          {workflowSteps.map((step, index) => (
            <WorkflowStep key={step.title} index={index + 1} {...step} />
          ))}
        </div>
      </section>

      <section className="bg-zinc-950 py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              AI that can be corrected
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Mark the render, write the instruction, generate the next version.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              One-shot renders are not enough for real planning. TrallAI lets
              you open a generated image, mark an area directly on the picture,
              and explain what should change. The next render is saved back to
              the project.
            </p>
            <div className="mt-7 grid gap-3 text-sm text-zinc-200">
              <FeatureLine text="Remove real-world objects that are being demolished." />
              <FeatureLine text="Correct parts that came from the reference photo but not the 3D plan." />
              <FeatureLine text="Keep the good parts of the render and iterate only where needed." />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-2xl">
            <Image
              src="/trall/landing/ai-review.png"
              alt="TrallAI AI image review modal with markup correction tools"
              width={1440}
              height={1000}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              What it can model
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for real deck planning, not just pretty pictures.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-650">
              The current project, Backsidan pool, shows the intended direction:
              a measured plan, a construction-readable 3D scene, and AI images
              that can be reviewed like design drafts.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <div
                key={capability}
                className="flex min-h-16 items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"
              >
                <BadgeCheckIcon className="size-5 shrink-0 text-emerald-700" />
                <span className="text-sm font-medium">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              TrallAI is open source.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Use it as a deck planning tool, a 3D construction preview, and a
              reference-photo AI visualization workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login?next=/">Open planner</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login?next=/dashboard">View projects</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[82svh] overflow-hidden">
      <Image
        priority
        src="/trall/landing/planner.png"
        alt="TrallAI Backsidan pool project in the deck planner"
        fill
        sizes="100vw"
        className="object-cover object-[55%_42%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.88),rgba(9,9,11,0.55)_42%,rgba(9,9,11,0.08))]" />
      <nav className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 text-white">
          <Link href="/landing" className="text-lg font-semibold">
            TrallAI
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/login?next=/">Open planner</Link>
            </Button>
          </div>
        </div>
      </nav>
      <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-7xl items-center px-5 pb-16 pt-24">
        <div className="max-w-2xl text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Open-source deck planning with AI visualization
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            TrallAI
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-100">
            Design a deck precisely in 2D, inspect the build in 3D, then create
            realistic property images from real reference photos and correct
            them with markup.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login?next=/">Try the planner</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="#workflow">See workflow</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProofItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3Icon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function WorkflowStep({
  description,
  icon: Icon,
  image,
  index,
  title,
}: {
  description: string
  icon: typeof Layers3Icon
  image: string
  index: number
  title: string
}) {
  return (
    <article
      className="grid overflow-hidden rounded-lg border bg-white shadow-sm lg:grid-cols-[0.82fr_1.18fr]"
      id={index === 1 ? "workflow" : undefined}
    >
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Icon className="size-5" />
          </div>
          <span className="text-sm font-semibold text-emerald-700">
            Step {index}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <div className="bg-zinc-100 p-2">
        <Image
          src={image}
          alt={`${title} screenshot`}
          width={1440}
          height={1000}
          className="h-full max-h-[32rem] w-full rounded-md object-cover object-left-top"
        />
      </div>
    </article>
  )
}

function FeatureLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <BadgeCheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-300" />
      <span>{text}</span>
    </div>
  )
}
