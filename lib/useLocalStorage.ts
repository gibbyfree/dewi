import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue
        try {
            const saved = localStorage.getItem(key)
            return saved ? JSON.parse(saved) : initialValue
        } catch {
            return initialValue
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // ignore errors
        }
    }, [key, value])

    return [value, setValue] as const
}
