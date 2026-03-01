/**
 * Data integrity / invariant tests.
 *
 * These tests verify structural properties across ALL items and recipes.
 * They grow automatically as items.json and recipes.json expand —
 * no need to add per-item assertions.
 */
import { describe, it, expect } from "vitest"
import type { GameItem, Recipe } from "@/types/items"
import itemsData from "@/data/items.json"
import recipesData from "@/data/recipes.json"
import { buildItemIndex } from "@/lib/recipeGraph"
import { getSourceItemName, getEffectivePrices, generateQualities } from "@/lib/prices"

import { getCaskAgingDays } from "@/config/processors"

const items = itemsData.items as GameItem[]
const recipes = recipesData.recipes as unknown as Recipe[]
const itemsByName = buildItemIndex(items)

const VALID_CATEGORIES = new Set([
    "crop",
    "fruit",
    "animal-product",
    "fish",
    "artisan-good",
    "processed",
    "cooked",
])

// ---------------------------------------------------------------------------
// Item-level invariants
// ---------------------------------------------------------------------------
describe("items.json integrity", () => {
    it("has no duplicate item names", () => {
        const names = items.map((i) => i.name)
        const dupes = names.filter((n, idx) => names.indexOf(n) !== idx)
        expect(dupes).toEqual([])
    })

    it("every item has a non-empty name", () => {
        for (const item of items) {
            expect(item.name.length).toBeGreaterThan(0)
        }
    })

    it("every item has a valid category", () => {
        for (const item of items) {
            expect(VALID_CATEGORIES.has(item.category)).toBe(true)
        }
    })

    it("every base item has prices with at least a base tier", () => {
        const baseItems = items.filter((i) => i.base)
        for (const item of baseItems) {
            expect(item.prices, `${item.name} missing prices`).toBeDefined()
            expect(item.prices!.base, `${item.name} missing base prices`).toBeDefined()
            expect(item.prices!.base.normal).toBeGreaterThan(0)
        }
    })

    it("all price tiers have normal >= 1", () => {
        for (const item of items) {
            if (!item.prices) continue
            for (const [tier, quals] of Object.entries(item.prices)) {
                expect(
                    quals.normal,
                    `${item.name}.prices.${tier}.normal`
                ).toBeGreaterThanOrEqual(1)
            }
        }
    })

    it("quality prices are ordered: normal <= silver <= gold <= iridium", () => {
        for (const item of items) {
            if (!item.prices) continue
            for (const [tier, quals] of Object.entries(item.prices)) {
                const n = quals.normal
                const s = quals.silver ?? n
                const g = quals.gold ?? s
                const ir = quals.iridium ?? g
                expect(s, `${item.name}.${tier} silver >= normal`).toBeGreaterThanOrEqual(n)
                expect(g, `${item.name}.${tier} gold >= silver`).toBeGreaterThanOrEqual(s)
                expect(ir, `${item.name}.${tier} iridium >= gold`).toBeGreaterThanOrEqual(g)
            }
        }
    })

    it("daysToRegrow only exists when daysToMature also exists", () => {
        for (const item of items) {
            if (item.daysToRegrow !== undefined) {
                expect(
                    item.daysToMature,
                    `${item.name} has daysToRegrow but no daysToMature`
                ).toBeDefined()
            }
        }
    })

    it("daysToMature is positive when present", () => {
        for (const item of items) {
            if (item.daysToMature !== undefined) {
                expect(item.daysToMature, item.name).toBeGreaterThan(0)
            }
        }
    })

    it("daysToRegrow is positive when present", () => {
        for (const item of items) {
            if (item.daysToRegrow !== undefined) {
                expect(item.daysToRegrow, item.name).toBeGreaterThan(0)
            }
        }
    })

    it("caskAgingDays values are ordered: silver < gold < iridium", () => {
        // Validate centralized cask aging config for all known cask-eligible items
        const caskItems = items.filter((i) => getCaskAgingDays(i.name))
        expect(caskItems.length).toBeGreaterThan(0)
        for (const item of caskItems) {
            const cask = getCaskAgingDays(item.name)!
            expect(cask.silver, `${item.name} cask silver`).toBeGreaterThan(0)
            expect(cask.gold, `${item.name} cask gold > silver`).toBeGreaterThan(cask.silver)
            expect(cask.iridium, `${item.name} cask iridium > gold`).toBeGreaterThan(cask.gold)
        }
    })

    it("non-base items should not have daysToMature/daysToRegrow", () => {
        const derived = items.filter((i) => !i.base)
        for (const item of derived) {
            expect(
                item.daysToMature,
                `${item.name} (derived) should not have daysToMature`
            ).toBeUndefined()
        }
    })
})

// ---------------------------------------------------------------------------
// Derived item price consistency
// ---------------------------------------------------------------------------
describe("derived item price consistency", () => {
    it("every non-base item can resolve effective prices", () => {
        const derived = items.filter((i) => !i.base)
        for (const item of derived) {
            const prices = getEffectivePrices(item, itemsByName)
            // Items with stored prices or computable prices should resolve
            // Some derived items might not match a pattern — that's OK,
            // but if they have a pattern match, prices should be non-null
            const source = getSourceItemName(item.name)
            if (source) {
                const sourceItem = itemsByName.get(source.sourceName)
                if (sourceItem?.prices?.base) {
                    expect(
                        prices,
                        `${item.name} should have computable prices (source: ${source.sourceName})`
                    ).not.toBeNull()
                    expect(prices!.base.normal).toBeGreaterThan(0)
                }
            }
        }
    })

    it("derived artisan prices are >= base prices", () => {
        const derived = items.filter((i) => !i.base)
        for (const item of derived) {
            const prices = getEffectivePrices(item, itemsByName)
            if (prices?.artisan && prices.base) {
                expect(
                    prices.artisan.normal,
                    `${item.name} artisan should be >= base`
                ).toBeGreaterThanOrEqual(prices.base.normal)
            }
        }
    })
})

// ---------------------------------------------------------------------------
// Recipe-level invariants
// ---------------------------------------------------------------------------
describe("recipes.json integrity", () => {
    it("every string-based recipe base references an existing item", () => {
        for (const recipe of recipes) {
            if (typeof recipe.base === "string") {
                expect(
                    itemsByName.has(recipe.base),
                    `Recipe base "${recipe.base}" not found in items`
                ).toBe(true)
            }
        }
    })

    it("every array-based recipe base references existing items", () => {
        for (const recipe of recipes) {
            if (Array.isArray(recipe.base)) {
                for (const name of recipe.base) {
                    expect(
                        itemsByName.has(name),
                        `Recipe base ingredient "${name}" not found in items`
                    ).toBe(true)
                }
            }
        }
    })

    it("every category-based recipe base uses a valid category", () => {
        for (const recipe of recipes) {
            if (typeof recipe.base === "object" && "category" in recipe.base) {
                expect(VALID_CATEGORIES.has(recipe.base.category)).toBe(true)
            }
        }
    })

    it("every recipe has at least one product", () => {
        for (const recipe of recipes) {
            expect(
                recipe.products.length,
                `Recipe for ${JSON.stringify(recipe.base)} has no products`
            ).toBeGreaterThan(0)
        }
    })

    it("every product has at least one ingredient", () => {
        for (const recipe of recipes) {
            for (const product of recipe.products) {
                expect(
                    product.ingredients.length,
                    `${product.name} has no ingredients`
                ).toBeGreaterThan(0)
            }
        }
    })

    it("every product has a non-empty processor name", () => {
        for (const recipe of recipes) {
            for (const product of recipe.products) {
                expect(product.processor.length).toBeGreaterThan(0)
            }
        }
    })

    it("ingredient quantities are positive", () => {
        for (const recipe of recipes) {
            for (const product of recipe.products) {
                for (const ing of product.ingredients) {
                    expect(
                        ing.quantity,
                        `${product.name} ingredient ${ing.name} quantity`
                    ).toBeGreaterThan(0)
                }
            }
        }
    })

    it("processingDays is non-negative when present", () => {
        for (const recipe of recipes) {
            for (const product of recipe.products) {
                if (product.processingDays !== undefined) {
                    expect(
                        product.processingDays,
                        `${product.name} processingDays`
                    ).toBeGreaterThanOrEqual(0)
                }
            }
        }
    })

    it("named products either exist in items.json or have a resolvable source", () => {
        for (const recipe of recipes) {
            // Only check non-template products (fixed names); skip category-based recipes
            if (typeof recipe.base === "object" && !Array.isArray(recipe.base)) continue
            for (const product of recipe.products) {
                if (product.nameTemplate) continue
                const inItems = itemsByName.has(product.name)
                const source = getSourceItemName(product.name)
                const hasSource = source !== null && itemsByName.has(source.sourceName)
                expect(
                    inItems || hasSource,
                    `Product "${product.name}" not in items and has no resolvable source`
                ).toBe(true)
            }
        }
    })
})
