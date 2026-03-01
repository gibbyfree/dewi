import * as React from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = React.useState<T>(initialValue)

    // Tracks whether we've completed the initial read for the current key
    const didInitRef = React.useRef(false)
    const keyRef = React.useRef(key)

    // If key changes, reset init flag
    if (keyRef.current !== key) {
        keyRef.current = key
        didInitRef.current = false
        // keep current value until effect runs; avoids render-time localStorage access
    }

    // Read after mount (hydration-safe)
    React.useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const raw = window.localStorage.getItem(key)
            if (raw !== null) setValue(JSON.parse(raw) as T)
        } catch {
            // ignore
        } finally {
            didInitRef.current = true
        }
    }, [key])

    // Write after init
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!didInitRef.current) return

        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // ignore
        }
    }, [key, value])

    return [value, setValue] as const
}