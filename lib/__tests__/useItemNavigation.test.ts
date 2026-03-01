/**
 * Tests for useItemNavigation state transitions.
 *
 * Since the hook uses a single consolidated state with pure updater functions,
 * we can test the navigation logic without React rendering by simulating
 * the state transitions directly.
 */
import { describe, it, expect } from "vitest"
import type { GameItem } from "@/types/items"

// ---------------------------------------------------------------------------
// Minimal state machine mirroring the hook's logic
// ---------------------------------------------------------------------------
interface NavState {
    currentItem: GameItem | null
    history: GameItem[]
}

function selectItem(state: NavState, item: GameItem): NavState {
    return { currentItem: item, history: [] }
}

function navigateTo(state: NavState, item: GameItem): NavState {
    return {
        currentItem: item,
        history: state.currentItem ? [...state.history, state.currentItem] : state.history,
    }
}

function goBack(state: NavState): NavState {
    if (state.history.length === 0) return state
    return {
        currentItem: state.history[state.history.length - 1],
        history: state.history.slice(0, -1),
    }
}

// ---------------------------------------------------------------------------
// Test items
// ---------------------------------------------------------------------------
const blueberry: GameItem = { name: "Blueberry", category: "fruit", base: true }
const blueberryWine: GameItem = { name: "Blueberry Wine", category: "artisan-good", base: false }
const blueberryJelly: GameItem = { name: "Blueberry Jelly", category: "artisan-good", base: false }
const ancientFruit: GameItem = { name: "Ancient Fruit", category: "fruit", base: true }

const INITIAL: NavState = { currentItem: null, history: [] }

// ---------------------------------------------------------------------------
describe("useItemNavigation state transitions", () => {
    it("starts with no item and empty history", () => {
        expect(INITIAL.currentItem).toBeNull()
        expect(INITIAL.history).toEqual([])
    })

    it("selectItem sets current and clears history", () => {
        const s = selectItem(INITIAL, blueberry)
        expect(s.currentItem).toBe(blueberry)
        expect(s.history).toEqual([])
    })

    it("navigateTo pushes previous item onto history", () => {
        let s = selectItem(INITIAL, blueberry)
        s = navigateTo(s, blueberryWine)
        expect(s.currentItem).toBe(blueberryWine)
        expect(s.history).toEqual([blueberry])
    })

    it("navigateTo from null does not push null onto history", () => {
        const s = navigateTo(INITIAL, blueberry)
        expect(s.currentItem).toBe(blueberry)
        expect(s.history).toEqual([])
    })

    it("goBack restores previous item and shortens history", () => {
        let s = selectItem(INITIAL, blueberry)
        s = navigateTo(s, blueberryWine)
        s = goBack(s)
        expect(s.currentItem).toBe(blueberry)
        expect(s.history).toEqual([])
    })

    it("goBack on empty history is a no-op", () => {
        const s = selectItem(INITIAL, blueberry)
        const s2 = goBack(s)
        expect(s2).toBe(s) // exact same reference — no change
    })

    // -----------------------------------------------------------------------
    // Regression: the original bug
    // -----------------------------------------------------------------------
    it("back button disappears after returning to start (no duplicate history entries)", () => {
        let s = selectItem(INITIAL, blueberry)          // view blueberry
        s = navigateTo(s, blueberryWine)                 // drill into wine
        expect(s.history.length).toBe(1)                 // history = [blueberry]

        s = goBack(s)                                    // go back
        expect(s.currentItem!.name).toBe("Blueberry")
        expect(s.history.length).toBe(0)                 // history must be empty
        // canGoBack would be history.length > 0 → false
    })

    it("navigateTo is idempotent (no extra history entries when called with same updater twice)", () => {
        // Simulates React Strict Mode calling the updater function twice
        const before = selectItem(INITIAL, blueberry)
        const after1 = navigateTo(before, blueberryWine)
        const after2 = navigateTo(before, blueberryWine)
        // Both calls against the SAME input state should produce the same result
        expect(after1).toEqual(after2)
        expect(after1.history.length).toBe(1)
    })

    // -----------------------------------------------------------------------
    // Deeper navigation
    // -----------------------------------------------------------------------
    it("supports multi-level navigation and full unwind", () => {
        let s = selectItem(INITIAL, blueberry)
        s = navigateTo(s, blueberryWine)
        s = navigateTo(s, blueberryJelly)   // wine → jelly (unusual but valid)
        expect(s.history).toEqual([blueberry, blueberryWine])

        s = goBack(s) // back to wine
        expect(s.currentItem).toBe(blueberryWine)
        expect(s.history).toEqual([blueberry])

        s = goBack(s) // back to blueberry
        expect(s.currentItem).toBe(blueberry)
        expect(s.history).toEqual([])
    })

    it("selectItem after navigation resets history completely", () => {
        let s = selectItem(INITIAL, blueberry)
        s = navigateTo(s, blueberryWine)
        s = selectItem(s, ancientFruit) // user picks a new item from search
        expect(s.currentItem).toBe(ancientFruit)
        expect(s.history).toEqual([])
    })
})
