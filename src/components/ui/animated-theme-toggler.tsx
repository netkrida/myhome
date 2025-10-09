"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export const AnimatedThemeToggler = ({ className }: Props) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const root = document.documentElement
    const storedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialDark = storedTheme ? storedTheme === "dark" : prefersDark

    root.classList.toggle("dark", initialDark)
    setIsDark(initialDark)

    const updateTheme = () => {
      setIsDark(root.classList.contains("dark"))
    }

    const observer = new MutationObserver(updateTheme)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const root = document.documentElement
    const newTheme = !isDark
    const applyTheme = () => {
      root.classList.toggle("dark", newTheme)
      localStorage.setItem("theme", newTheme ? "dark" : "light")
      setIsDark(newTheme)
    }

    const startViewTransition = (document as any).startViewTransition?.bind(document)

    if (!startViewTransition) {
      flushSync(applyTheme)
      return
    }

    await startViewTransition(() => {
      flushSync(applyTheme)
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [isDark])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "h-10 w-10 p-0 flex items-center justify-center border border-border rounded-lg bg-background shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus:outline-none",
        className
      )}
      style={{ minWidth: 0, minHeight: 0 }}
    >
  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
