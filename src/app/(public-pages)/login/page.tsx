"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconLoader2, IconAlertTriangle } from "@tabler/icons-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [sessionExpired, setSessionExpired] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  // Check for session expiration on mount
  useEffect(() => {
    const expired = searchParams.get("sessionExpired")
    if (expired === "true") {
      setSessionExpired(true)
      setError("Your session has expired. Please log in again.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("🔍 Login attempt starting...")
      console.log("🌐 Current URL:", window.location.href)
      console.log("🔗 Expected auth endpoint:", `${window.location.origin}/api/auth/signin`)

      // Test if auth endpoint is accessible
      try {
        const testResponse = await fetch('/api/auth/providers')
        console.log("🧪 Auth providers test:", testResponse.status, testResponse.statusText)
        if (!testResponse.ok) {
          console.error("❌ Auth endpoint not accessible:", testResponse.status)
          setError(`Authentication service unavailable (${testResponse.status}). Please check deployment configuration.`)
          return
        }
      } catch (fetchError) {
        console.error("❌ Failed to reach auth endpoint:", fetchError)
        setError("Cannot connect to authentication service. Please check your deployment.")
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("🔍 SignIn result:", result)

      if (result?.error) {
        console.error("❌ SignIn error:", result.error)
        setError("Invalid credentials")
      } else {
        console.log("✅ SignIn successful, result:", result)

        try {
          const sessionResponse = await fetch("/api/auth/session")
          if (!sessionResponse.ok) {
            throw new Error(`Failed to fetch session: ${sessionResponse.status}`)
          }

          const sessionData = await sessionResponse.json()
          const role = sessionData?.user?.role?.toLowerCase()

          const target = (callbackUrl && callbackUrl !== "/login")
            ? callbackUrl
            : role === "superadmin"
              ? "/dashboard/superadmin"
              : role === "adminkos"
                ? "/dashboard/adminkos"
                : role === "receptionist"
                  ? "/dashboard/receptionist"
                  : "/"

          console.log("🔄 Login - Redirecting user based on role:", { role, target })
          window.location.href = target
        } catch (sessionError) {
          console.error("❌ Failed to determine redirect target:", sessionError)
          window.location.href = "/"
        }
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      setError(`An error occurred during login: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Alternative server action method

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Sign in to myhome
              </CardTitle>
              <CardDescription className="text-center">
                masukkan username & password anda yang benar
              </CardDescription>
            </CardHeader>
            <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>


          {/* Session Expiration Alert */}
          {sessionExpired && (
            <Alert variant="destructive" className="mt-4">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your session has expired or become invalid. Please log in again.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
      
      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
      
      {/* Back to Home */}
      <div className="text-center">
        <Link 
          href="/" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  </main>
  
  <PublicFooter />
</div>
  )
}
