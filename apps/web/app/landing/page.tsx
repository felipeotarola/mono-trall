"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BadgeCheckIcon,
  BoxIcon,
  CalculatorIcon,
  GitForkIcon,
  ImagePlusIcon,
  Layers3Icon,
  MousePointer2Icon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type Language = "en" | "sv"

const repositoryUrl = "https://github.com/felipeotarola/mono-trall"
const deployUrl =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffelipeotarola%2Fmono-trall&project-name=trallai&repository-name=mono-trall&root-directory=apps%2Fweb&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,OPENAI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=TrallAI%20needs%20Supabase%20credentials%20for%20auth%20and%20project%20storage%2C%20plus%20OpenAI%20and%20Vercel%20Blob%20tokens%20for%20AI%20image%20generation%20and%20saved%20assets."

const copy = {
  en: {
    navCta: "Open planner",
    navRepository: "Repository",
    navDeploy: "Deploy",
    heroEyebrow: "Open-source deck planning with AI visualization",
    heroText:
      "Design a deck precisely in 2D, inspect the build in 3D, then create realistic property images from real reference photos and correct them with markup.",
    heroPrimary: "Try the planner",
    heroDemo: "Try demo",
    heroSecondary: "See workflow",
    proof: [
      {
        icon: Layers3Icon,
        label: "Planner first",
        value: "2D stays source of truth",
      },
      { icon: BoxIcon, label: "Preview", value: "Real 3D levels" },
      {
        icon: ImagePlusIcon,
        label: "AI",
        value: "Reference photos + model",
      },
      {
        icon: CalculatorIcon,
        label: "Material takeoff",
        value: "Linear metres to price",
      },
    ],
    workflowEyebrow: "From measured plan to believable image",
    workflowTitle:
      "TrallAI turns a deck idea into something you can inspect, explain, and revise.",
    workflowText:
      "The planner is built around a practical workflow: keep geometry precise in 2D, validate the build relationship in 3D, calculate the material lengths behind the quote, then use AI to communicate how the project could look on the real property.",
    stepLabel: "Step",
    workflowSteps: [
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
        title: "Estimate real material quantities",
        description:
          "TrallAI calculates linear metres from the deck geometry and selected boards, so material choices can produce a practical price estimate instead of a rough guess.",
        image: "/trall/landing/planner.png",
        icon: CalculatorIcon,
      },
      {
        title: "Review with AI images",
        description:
          "Compare the original property photos with finished generated images that combine the real site with the planned 3D model.",
        icon: SparklesIcon,
        gallery: [
          {
            alt: "Original property reference photo from the garden",
            label: "Reference 1",
            src: "/1.jpeg",
          },
          {
            alt: "Second original property reference photo from the garden",
            label: "Reference 2",
            src: "/2.jpeg",
          },
          {
            alt: "Finished generated deck visualization from the first reference photo",
            label: "Generated result 1",
            src: "/trall/landing/generated-render-1.png",
          },
          {
            alt: "Finished generated deck visualization from the second reference photo",
            label: "Generated result 2",
            src: "/trall/landing/generated-render-2.png",
          },
        ],
      },
    ],
    aiEyebrow: "AI that can be corrected",
    aiTitle: "Mark the render, write the instruction, generate the next version.",
    aiText:
      "One-shot renders are not enough for real planning. TrallAI lets you open a generated image, mark an area directly on the picture, and explain what should change. The next render is saved back to the project.",
    aiLines: [
      "Remove real-world objects that are being demolished.",
      "Correct parts that came from the reference photo but not the 3D plan.",
      "Keep the good parts of the render and iterate only where needed.",
    ],
    modelEyebrow: "What it can model",
    modelTitle: "Built for real deck planning, not just pretty pictures.",
    modelText:
      "The current project, Backsidan pool, shows the intended direction: a measured plan, a construction-readable 3D scene, material quantities that turn into real price estimates, and AI images that can be reviewed like design drafts.",
    capabilities: [
      "2D precision deck planner",
      "3D terrain and elevation preview",
      "Pool, stairs, fences, pergolas, planting, and lighting",
      "House dimensions, roof styles, doors, and windows",
      "Linear-metre material takeoff for price estimates",
      "Materials and visual presets",
      "AI property renders from real reference photos",
      "Markup-based AI correction loop",
      "Saved project history and saved AI images",
    ],
    footerTitle: "TrallAI is open source.",
    footerText:
      "Use it as a deck planning tool, a 3D construction preview, and a reference-photo AI visualization workflow.",
    footerPrimary: "Open planner",
    footerDemo: "Try demo",
    footerRepository: "View repository",
    footerDeploy: "Deploy with Vercel",
    footerSecondary: "View projects",
    imageAlt: "TrallAI AI image review modal with markup correction tools",
    heroAlt: "TrallAI Backsidan pool project in the deck planner",
  },
  sv: {
    navCta: "Öppna planeringen",
    navRepository: "Repository",
    navDeploy: "Deploya",
    heroEyebrow: "Open source-planering för altan med AI-visualisering",
    heroText:
      "Rita altanen exakt i 2D, granska bygget i 3D och skapa realistiska bilder från riktiga referensfoton. Markera fel och generera om bara det som behöver ändras.",
    heroPrimary: "Testa planeringen",
    heroDemo: "Testa demo",
    heroSecondary: "Se arbetsflödet",
    proof: [
      {
        icon: Layers3Icon,
        label: "Planen först",
        value: "2D är sanningen",
      },
      { icon: BoxIcon, label: "Förhandsvisning", value: "Riktiga 3D-nivåer" },
      {
        icon: ImagePlusIcon,
        label: "AI",
        value: "Foton + modell",
      },
      {
        icon: CalculatorIcon,
        label: "Materialuttag",
        value: "Löpmeter till pris",
      },
    ],
    workflowEyebrow: "Från uppmätt plan till trovärdig bild",
    workflowTitle:
      "TrallAI gör en altanidé till något du kan granska, förklara och justera.",
    workflowText:
      "Arbetsflödet är byggt för praktisk planering: håll geometrin exakt i 2D, kontrollera bygget och nivåerna i 3D, räkna ut materialets löpmeter bakom offerten och använd sedan AI för att visa hur projektet kan se ut på den riktiga tomten.",
    stepLabel: "Steg",
    workflowSteps: [
      {
        title: "Rita altanen i 2D",
        description:
          "Planera exakta kanter, mått, poolplacering, trappor, staket, pergola, växter och husets dörrar och fönster i planvyn.",
        image: "/trall/landing/planner.png",
        icon: MousePointer2Icon,
      },
      {
        title: "Granska bygget i 3D",
        description:
          "Vrid runt projektet och kontrollera altannivåer, lutande mark, stödreglar, glasräcken, poolhöjd, takform och material.",
        image: "/trall/landing/preview-3d.png",
        icon: BoxIcon,
      },
      {
        title: "Räkna fram riktiga materialmängder",
        description:
          "TrallAI räknar ut löpmeter från altanens geometri och valda brädor, så materialvalen kan ge en praktisk prisuppskattning istället för en grov gissning.",
        image: "/trall/landing/planner.png",
        icon: CalculatorIcon,
      },
      {
        title: "Granska med AI-bilder",
        description:
          "Jämför originalbilderna från tomten med färdiga genererade bilder där den riktiga platsen kombineras med den planerade 3D-modellen.",
        icon: SparklesIcon,
        gallery: [
          {
            alt: "Original referensbild från trädgården",
            label: "Referens 1",
            src: "/1.jpeg",
          },
          {
            alt: "Andra originala referensbilden från trädgården",
            label: "Referens 2",
            src: "/2.jpeg",
          },
          {
            alt: "Färdig genererad altanvisualisering från första referensbilden",
            label: "Genererad bild 1",
            src: "/trall/landing/generated-render-1.png",
          },
          {
            alt: "Färdig genererad altanvisualisering från andra referensbilden",
            label: "Genererad bild 2",
            src: "/trall/landing/generated-render-2.png",
          },
        ],
      },
    ],
    aiEyebrow: "AI som går att korrigera",
    aiTitle: "Markera bilden, skriv instruktionen och generera nästa version.",
    aiText:
      "En enda AI-rendering räcker inte för riktig planering. I TrallAI kan du öppna en genererad bild, markera ett område direkt i bilden och förklara vad som ska ändras. Nästa version sparas tillbaka i projektet.",
    aiLines: [
      "Ta bort verkliga objekt som ändå ska rivas.",
      "Korrigera delar som kommer från referensfotot men inte från 3D-planen.",
      "Behåll det som blev bra och iterera bara där det behövs.",
    ],
    modelEyebrow: "Vad den kan modellera",
    modelTitle: "Byggt för riktig altanplanering, inte bara snygga bilder.",
    modelText:
      "Projektet Backsidan pool visar riktningen: en uppmätt plan, en 3D-scen som går att läsa byggmässigt, materialmängder som blir prisuppskattningar och AI-bilder som kan granskas som designutkast.",
    capabilities: [
      "Exakt altanplanering i 2D",
      "3D-förhandsvisning med terräng och nivåer",
      "Pool, trappor, staket, pergola, växter och belysning",
      "Husmått, takstilar, dörrar och fönster",
      "Materialuttag i löpmeter för prisuppskattning",
      "Material och visuella förval",
      "AI-renderingar från riktiga referensfoton",
      "Korrigering av AI-bilder med markeringar",
      "Sparad projekthistorik och sparade AI-bilder",
    ],
    footerTitle: "TrallAI är open source.",
    footerText:
      "Använd det som altanplanerare, 3D-förhandsvisning för bygget och arbetsflöde för AI-visualisering med referensfoton.",
    footerPrimary: "Öppna planeringen",
    footerDemo: "Testa demo",
    footerRepository: "Se repository",
    footerDeploy: "Deploya med Vercel",
    footerSecondary: "Visa projekt",
    imageAlt: "TrallAI-modal för AI-bildgranskning med markeringsverktyg",
    heroAlt: "TrallAI-projektet Backsidan pool i altanplaneraren",
  },
} as const

export default function LandingPage() {
  const [language, setLanguage] = useState<Language>("sv")
  const t = copy[language]

  return (
    <main className="min-h-svh bg-[#f5f4ef] text-zinc-950">
      <HeroSection
        language={language}
        t={t}
        onLanguageChange={setLanguage}
      />
      <section className="border-y bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.proof.map((item) => (
            <ProofItem key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {t.workflowEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.workflowTitle}
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-650">
            {t.workflowText}
          </p>
        </div>

        <div className="mt-10 grid gap-6">
          {t.workflowSteps.map((step, index) => (
            <WorkflowStep
              key={step.title}
              index={index + 1}
              stepLabel={t.stepLabel}
              {...step}
            />
          ))}
        </div>
      </section>

      <section className="bg-zinc-950 py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {t.aiEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.aiTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              {t.aiText}
            </p>
            <div className="mt-7 grid gap-3 text-sm text-zinc-200">
              {t.aiLines.map((line) => (
                <FeatureLine key={line} text={line} />
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-2xl">
            <Image
              src="/redigera.png"
              alt={t.imageAlt}
              width={2940}
              height={1668}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {t.modelEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.modelTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-650">
              {t.modelText}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.capabilities.map((capability) => (
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
              {t.footerTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              {t.footerText}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login?next=/">{t.footerPrimary}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/demo">{t.footerDemo}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login?next=/dashboard">{t.footerSecondary}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={repositoryUrl} target="_blank" rel="noreferrer">
                <GitForkIcon className="size-4" />
                {t.footerRepository}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={deployUrl} target="_blank" rel="noreferrer">
                <RocketIcon className="size-4" />
                {t.footerDeploy}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function HeroSection({
  language,
  onLanguageChange,
  t,
}: {
  language: Language
  onLanguageChange: (language: Language) => void
  t: (typeof copy)[Language]
}) {
  return (
    <section className="relative min-h-[82svh] overflow-hidden">
      <Image
        priority
        src="/trall/landing/planner.png"
        alt={t.heroAlt}
        fill
        sizes="100vw"
        className="object-cover object-[55%_42%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.88),rgba(9,9,11,0.55)_42%,rgba(9,9,11,0.08))]" />
      <nav className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 text-white">
          <Link href="/landing" className="text-lg font-semibold">
            TrallAI
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle
              language={language}
              onLanguageChange={onLanguageChange}
            />
            <Button
              asChild
              variant="outline"
              className="hidden border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:inline-flex"
            >
              <Link href={repositoryUrl} target="_blank" rel="noreferrer">
                <GitForkIcon className="size-4" />
                {t.navRepository}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hidden border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white lg:inline-flex"
            >
              <Link href={deployUrl} target="_blank" rel="noreferrer">
                <RocketIcon className="size-4" />
                {t.navDeploy}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hidden border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white md:inline-flex"
            >
              <Link href="/demo">{t.heroDemo}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/login?next=/">{t.navCta}</Link>
            </Button>
          </div>
        </div>
      </nav>
      <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-7xl items-center px-5 pb-16 pt-24">
        <div className="max-w-2xl text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            {t.heroEyebrow}
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            TrallAI
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-100">
            {t.heroText}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login?next=/">{t.heroPrimary}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/demo">{t.heroDemo}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="#workflow">{t.heroSecondary}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function LanguageToggle({
  language,
  onLanguageChange,
}: {
  language: Language
  onLanguageChange: (language: Language) => void
}) {
  return (
    <div
      aria-label="Language"
      className="flex h-10 items-center rounded-lg border border-white/25 bg-white/10 p-1"
      role="group"
    >
      {(["en", "sv"] as const).map((option) => (
        <button
          key={option}
          aria-pressed={language === option}
          className={
            language === option
              ? "h-8 rounded-md bg-white px-3 text-xs font-semibold text-zinc-950 shadow-sm"
              : "h-8 rounded-md px-3 text-xs font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          }
          type="button"
          onClick={() => onLanguageChange(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
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
  gallery,
  icon: Icon,
  image,
  index,
  stepLabel,
  title,
}: {
  description: string
  gallery?: readonly {
    alt: string
    label: string
    src: string
  }[]
  icon: typeof Layers3Icon
  image?: string
  index: number
  stepLabel: string
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
            {stepLabel} {index}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <div className="space-y-2 bg-zinc-100 p-2">
        {gallery ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {gallery.map((item) => (
              <figure
                key={item.src}
                className="overflow-hidden rounded-md border bg-white"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={2048}
                    height={1536}
                    className="max-h-full w-full object-contain"
                  />
                </div>
                <figcaption className="border-t px-3 py-2 text-xs font-medium text-zinc-600">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : image ? (
          <Image
            src={image}
            alt={`${title} screenshot`}
            width={1440}
            height={1000}
            className="max-h-[32rem] w-full rounded-md object-cover object-left-top"
          />
        ) : null}
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
