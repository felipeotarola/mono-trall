"use client"

import { Suspense } from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null)
  const nextPath = searchParams.get("next") ?? "/"

  async function signIn() {
    setLoading("signin")
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(null)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  async function signUp() {
    setLoading("signup")
    setError(null)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(null)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-100/60 p-4 dark:bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to TrallAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Button disabled={loading !== null} onClick={signIn}>
              {loading === "signin" ? "Signing in..." : "Sign in"}
            </Button>
            <Button
              disabled={loading !== null}
              variant="secondary"
              onClick={signUp}
            >
              {loading === "signup" ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
