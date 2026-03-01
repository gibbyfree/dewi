"use client"

import { useState, useCallback } from "react"
import type { GameItem } from "@/types/items"

export interface ItemNavigation {
    currentItem: GameItem | null
    history: GameItem[]
    selectItem: (item: GameItem) => void
    navigateTo: (item: GameItem) => void
    goBack: () => void
    canGoBack: boolean
    reset: () => void
}

interface NavState {
    currentItem: GameItem | null
    history: GameItem[]
}

const INITIAL_STATE: NavState = { currentItem: null, history: [] }

/**
 * Hook for navigating between items with back-history support.
 * Used when clicking a derived item sprite to drill into its details.
 */
export function useItemNavigation(): ItemNavigation {
    const [state, setState] = useState<NavState>(INITIAL_STATE)

    const selectItem = useCallback((item: GameItem) => {
        setState({ currentItem: item, history: [] })
    }, [])

    const navigateTo = useCallback((item: GameItem) => {
        setState(prev => ({
            currentItem: item,
            history: prev.currentItem ? [...prev.history, prev.currentItem] : prev.history,
        }))
    }, [])

    const goBack = useCallback(() => {
        setState(prev => {
            if (prev.history.length === 0) return prev
            const newHistory = prev.history.slice(0, -1)
            return {
                currentItem: prev.history[prev.history.length - 1],
                history: newHistory,
            }
        })
    }, [])

    const reset = useCallback(() => {
        setState(INITIAL_STATE)
    }, [])

    return {
        currentItem: state.currentItem,
        history: state.history,
        selectItem,
        navigateTo,
        goBack,
        canGoBack: state.history.length > 0,
        reset,
    }
}
