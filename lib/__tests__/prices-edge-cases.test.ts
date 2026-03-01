/**
 * Additional edge-case tests for price functions.
 * Uses synthetic data where possible to be data-agnostic.
 */
import { describe, it, expect } from "vitest"
import {
    resolveFormula,
    applyQualityMultiplier,
    generateQualities,
    applyProfessionMultiplier,
    getSourceItemName,
    getEffectivePrices,
    getPriceCategory,
    goldPerDayFirstHarvest,
    goldPerDayRegrow,
    goldPerDayProcessed,
} from "@/lib/prices"
import { buildItemIndex } from "@/lib/recipeGraph"
import type { GameItem } from "@/types/items"

// ---------------------------------------------------------------------------
// Formula edge cases
// ---------------------------------------------------------------------------
describe("resolveFormula edge cases", () => {
    it("handles base price of 0", () => {
        expect(resolveFormula("wine", 0)).toBe(0)
        expect(resolveFormula("jelly", 0)).toBe(50) // 2*0 + 50
        expect(resolveFormula("pickles", 0)).toBe(50)
        expect(resolveFormula("juice", 0)).toBe(0)
        expect(resolveFormula("dried", 0)).toBe(25) // 0*7.5 + 25
        expect(resolveFormula("roe", 0)).toBe(30) // 30 + 0
    })

    it("handles base price of 1", () => {
        expect(resolveFormula("wine", 1)).toBe(3)
        expect(resolveFormula("jelly", 1)).toBe(52)
        expect(resolveFormula("juice", 1)).toBe(2) // floor(2.25)
        expect(resolveFormula("dried", 1)).toBe(32) // floor(7.5 + 25)
    })

    it("all formulas return integers", () => {
        const formulas = ["wine", "jelly", "pickles", "juice", "dried", "smoked_fish", "roe", "aged_roe"]
        for (const f of formulas) {
            const result = resolveFormula(f, 77)!
            expect(Number.isInteger(result), `${f}(77) = ${result} should be integer`).toBe(true)
        }
    })
})

// ---------------------------------------------------------------------------
// Quality multiplier edge cases
// ---------------------------------------------------------------------------
describe("applyQualityMultiplier edge cases", () => {
    it("floors correctly with odd base prices", () => {
        // 77 * 1.25 = 96.25 → 96
        expect(applyQualityMultiplier(77, "silver")).toBe(96)
        // 77 * 1.5 = 115.5 → 115
        expect(applyQualityMultiplier(77, "gold")).toBe(115)
    })

    it("handles 0 price", () => {
        expect(applyQualityMultiplier(0, "iridium")).toBe(0)
    })
})

describe("generateQualities edge cases", () => {
    it("zero price", () => {
        expect(generateQualities(0)).toEqual({
            normal: 0,
            silver: 0,
            gold: 0,
            iridium: 0,
        })
    })

    it("small price", () => {
        // 1 * 1.25 = floor(1.25) = 1
        expect(generateQualities(1)).toEqual({
            normal: 1,
            silver: 1,
            gold: 1,
            iridium: 2,
        })
    })
})

// ---------------------------------------------------------------------------
// Profession multiplier edge cases
// ---------------------------------------------------------------------------
describe("applyProfessionMultiplier edge cases", () => {
    it("floors correctly", () => {
        // 77 * 1.1 = 84.7 → 84
        expect(applyProfessionMultiplier(77, "tiller")).toBe(84)
    })

    it("handles zero", () => {
        expect(applyProfessionMultiplier(0, "artisan")).toBe(0)
    })
})

// ---------------------------------------------------------------------------
// getSourceItemName edge cases
// ---------------------------------------------------------------------------
describe("getSourceItemName edge cases", () => {
    it("handles items with Wine in the base name", () => {
        // If someone named a fruit "Wine Grape" → "Wine Grape Wine"
        const result = getSourceItemName("Wine Grape Wine")
        expect(result).toEqual({ sourceName: "Wine Grape", formula: "wine" })
    })

    it("handles multi-word source names", () => {
        expect(getSourceItemName("Dried Red Cabbage")).toEqual({
            sourceName: "Red Cabbage",
            formula: "dried",
        })
    })

    it("handles single-word items", () => {
        expect(getSourceItemName("Pickled Corn")).toEqual({
            sourceName: "Corn",
            formula: "pickles",
        })
    })

    it("does not match partial patterns", () => {
        expect(getSourceItemName("Winery")).toBeNull()
        expect(getSourceItemName("Jellyfish")).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// getEffectivePrices with synthetic data
// ---------------------------------------------------------------------------
describe("getEffectivePrices (synthetic)", () => {
    const items: GameItem[] = [
        {
            name: "TestFruit",
            category: "fruit",
            base: true,
            prices: { base: { normal: 100, silver: 125, gold: 150, iridium: 200 } },
        },
        {
            name: "TestFruit Wine",
            category: "artisan-good",
            base: false,
        },
        {
            name: "OrphanWine Wine",
            category: "artisan-good",
            base: false,
            // Source "OrphanWine" doesn't exist
        },
        {
            name: "ItemWithStoredPrices",
            category: "artisan-good",
            base: false,
            prices: { base: { normal: 999 } },
        },
    ]
    const index = buildItemIndex(items)

    it("computes derived price from source", () => {
        const wine = index.get("TestFruit Wine")!
        const prices = getEffectivePrices(wine, index)!
        expect(prices.base.normal).toBe(300) // wine: 100 * 3
    })

    it("returns stored prices when item has them", () => {
        const item = index.get("ItemWithStoredPrices")!
        const prices = getEffectivePrices(item, index)
        expect(prices).toBe(item.prices) // reference equality
    })

    it("returns null when source item not found", () => {
        const orphan = index.get("OrphanWine Wine")!
        const prices = getEffectivePrices(orphan, index)
        expect(prices).toBeNull()
    })

    it("returns null for unrecognized derived names", () => {
        const unknown: GameItem = {
            name: "Mystery Sauce",
            category: "artisan-good",
            base: false,
        }
        expect(getEffectivePrices(unknown, index)).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// getPriceCategory edge cases
// ---------------------------------------------------------------------------
describe("getPriceCategory edge cases", () => {
    it("processed category also gets artisan", () => {
        expect(
            getPriceCategory("Some Processed", "processed", false, false, ["artisan"])
        ).toBe("artisan")
    })

    it("multiple irrelevant professions still return base", () => {
        expect(
            getPriceCategory("Apple", "fruit", false, false, ["rancher", "angler"])
        ).toBe("base")
    })

    it("forageable berry that was grown gets tiller (not bearsKnowledge)", () => {
        expect(
            getPriceCategory("Blackberry", "fruit", true, false, ["tiller", "bearsKnowledge"])
        ).toBe("tiller")
    })

    it("non-forageable crop with all professions gets tiller", () => {
        expect(
            getPriceCategory("Corn", "crop", false, false, [
                "tiller", "artisan", "rancher", "angler", "bearsKnowledge",
            ])
        ).toBe("tiller")
    })
})

// ---------------------------------------------------------------------------
// Gold per day edge cases
// ---------------------------------------------------------------------------
describe("gold per day edge cases", () => {
    it("goldPerDayProcessed uses 1 when processingDays is 0", () => {
        // The function falls back to 1 for zero processing days
        const gpd = goldPerDayProcessed(100, 0, false, 1)
        expect(gpd).toBe(100)
    })

    it("goldPerDayProcessed handles negative delta", () => {
        const gpd = goldPerDayProcessed(-50, 2, false, 1)
        expect(gpd).toBe(-25)
    })

    it("goldPerDayProcessed dehydrator with 0 processing days", () => {
        const gpd = goldPerDayProcessed(100, 0, true, 5)
        expect(gpd).toBe(20) // 100 / 1 / 5
    })

    it("goldPerDayFirstHarvest with large values", () => {
        const gpd = goldPerDayFirstHarvest(1000, 1)
        expect(gpd).toBe(1000)
    })
})
