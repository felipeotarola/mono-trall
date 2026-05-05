"use client"

import { Suspense } from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
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
    if (password !== passwordConfirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading("signup")
    setError(null)

    const createResponse = await fetch("/api/auth/create-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
    const createPayload = (await createResponse.json().catch(() => null)) as {
      error?: string
    } | null

    if (!createResponse.ok) {
      setLoading(null)
      setError(createPayload?.error ?? "Could not create account.")
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(null)

    if (signInError) {
      setError(
        "Account created, but automatic sign-in failed. Please sign in with your new password."
      )
      setMode("signin")
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-100/60 p-4 dark:bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {mode === "signin" ? "Sign in to TrallAI" : "Create account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Use your account to open the planner and saved projects."
              : "Start immediately. No email confirmation is required."}
          </CardDescription>
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
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {mode === "signup" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password-confirm">
                Confirm password
              </label>
              <Input
                id="password-confirm"
                autoComplete="new-password"
                minLength={6}
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </div>
          ) : null}
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="grid gap-2">
            {mode === "signin" ? (
              <>
                <Button disabled={loading !== null} onClick={signIn}>
                  {loading === "signin" ? "Signing in..." : "Sign in"}
                </Button>
                <Button
                  disabled={loading !== null}
                  variant="secondary"
                  onClick={() => {
                    setError(null)
                    setMode("signup")
                  }}
                >
                  Create account
                </Button>
              </>
            ) : (
              <>
                <Button disabled={loading !== null} onClick={signUp}>
                  {loading === "signup"
                    ? "Creating account..."
                    : "Create account"}
                </Button>
                <Button
                  disabled={loading !== null}
                  variant="ghost"
                  onClick={() => {
                    setError(null)
                    setMode("signin")
                  }}
                >
                  Back to sign in
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
