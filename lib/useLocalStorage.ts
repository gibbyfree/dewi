import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
    // Always use initialValue for SSR and first client render
    const [value, setValue] = useState<T>(initialValue)
    const [isInitialized, setIsInitialized] = useState(false)

    // Load from localStorage only after mounting (client-side only)
    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const saved = localStorage.getItem(key)
            if (saved) {
                setValue(JSON.parse(saved))
            }
        } catch {
            // ignore errors
        }
        setIsInitialized(true)
    }, [key])

    // Save to localStorage whenever value changes (but only after initialization)
    useEffect(() => {
        if (!isInitialized || typeof window === "undefined") return

        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // ignore errors
        }
    }, [key, value, isInitialized])

    return [value, setValue] as const
}
