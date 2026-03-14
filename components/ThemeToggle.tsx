"use client"

import { useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useLocalStorage } from "@/lib/useLocalStorage"

export function ThemeToggle() {
    const [theme, setTheme] = useLocalStorage<"dark" | "light">("theme", "dark")

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark")
    }, [theme])

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
    )
}
