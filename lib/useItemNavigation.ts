"use client"

import { useState, useCallback } from "react"
import type { GameItem } from "@/types/items"

export interface ItemNavigation {
    currentItem: GameItem | null
    history: GameItem[]
    navigateTo: (item: GameItem) => void
    goBack: () => void
    canGoBack: boolean
    reset: () => void
}

/**
 * Hook for navigating between items with back-history support.
 * Used when clicking a derived item sprite to drill into its details.
 */
export function useItemNavigation(): ItemNavigation {
    const [currentItem, setCurrentItem] = useState<GameItem | null>(null)
    const [history, setHistory] = useState<GameItem[]>([])

    const navigateTo = useCallback((item: GameItem) => {
        setCurrentItem(prev => {
            if (prev) {
                setHistory(h => [...h, prev])
            }
            return item
        })
    }, [])

    const goBack = useCallback(() => {
        setHistory(h => {
            const newHistory = [...h]
            const prev = newHistory.pop()
            if (prev) {
                setCurrentItem(prev)
            }
            return newHistory
        })
    }, [])

    const reset = useCallback(() => {
        setCurrentItem(null)
        setHistory([])
    }, [])

    return {
        currentItem,
        history,
        navigateTo,
        goBack,
        canGoBack: history.length > 0,
        reset,
    }
}
