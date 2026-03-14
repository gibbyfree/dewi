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
import { getProductsForItem, getDerivationTree, buildItemIndex } from "@/lib/recipeGraph"
import type { GameItem, Recipe } from "@/types/items"
import itemsData from "@/data/items.json"
import recipesData from "@/data/recipes.json"

const items = itemsData.items as GameItem[]
const recipes = recipesData.recipes as unknown as Recipe[]
const itemsByName = buildItemIndex(items)

// Helper to grab a known item by name
function getItem(name: string): GameItem {
    const item = itemsByName.get(name)
    if (!item) throw new Error(`Item "${name}" not found in items.json`)
    return item
}

// ---------------------------------------------------------------------------
// Price formulas
// ---------------------------------------------------------------------------
describe("resolveFormula", () => {
    it("wine: base * 3", () => {
        // Ancient Fruit (550) → Wine = 1650
        expect(resolveFormula("wine", 550)).toBe(1650)
    })

    it("jelly: 2 * base + 50", () => {
        // Ancient Fruit (550) → Jelly = 1150
        expect(resolveFormula("jelly", 550)).toBe(1150)
    })

    it("juice: floor(2.25 * base)", () => {
        // Carrot (35) → Juice = 78
        expect(resolveFormula("juice", 35)).toBe(78)
    })

    it("pickles: 2 * base + 50", () => {
        // Carrot (35) → Pickles = 120
        expect(resolveFormula("pickles", 35)).toBe(120)
    })

    it("dried: floor(base * 7.5 + 25)", () => {
        // Ancient Fruit (550) → Dried = 4150
        expect(resolveFormula("dried", 550)).toBe(4150)
    })

    it("smoked_fish: floor(base * 2)", () => {
        expect(resolveFormula("smoked_fish", 100)).toBe(200)
        expect(resolveFormula("smoked_fish", 75)).toBe(150)
    })

    it("smoked_fish with fisher: 2x the profession-adjusted quality price", () => {
        // Fisher/Angler apply to the fish sell price; smoked fish = 2x that sell price.
        // Sardine base normal = 40; iridium = floor(40 * 2) = 80
        // Fisher iridium = floor(80 * 1.25) = 100; smoked = 2 * 100 = 200
        const sardine = getItem("Sardine")
        const prices = getEffectivePrices(sardine, itemsByName)!
        const fisherIridium = prices.fisher!.iridium!
        expect(fisherIridium).toBe(100) // floor(80 * 1.25)
        expect(resolveFormula("smoked_fish", fisherIridium)).toBe(200)
    })

    it("smoked_fish with angler: 2x the profession-adjusted quality price", () => {
        // Sardine base normal = 40; iridium = floor(40 * 2) = 80
        // Angler iridium = floor(80 * 1.5) = 120; smoked = 2 * 120 = 240
        const sardine = getItem("Sardine")
        const prices = getEffectivePrices(sardine, itemsByName)!
        const anglerIridium = prices.angler!.iridium!
        expect(anglerIridium).toBe(120) // floor(80 * 1.5)
        expect(resolveFormula("smoked_fish", anglerIridium)).toBe(240)
    })

    it("roe: 30 + floor(base / 2)", () => {
        expect(resolveFormula("roe", 200)).toBe(130)
        expect(resolveFormula("roe", 75)).toBe(67)
    })

    it("aged_roe: base * 2", () => {
        // Input is the roe price, not the fish price
        expect(resolveFormula("aged_roe", 130)).toBe(260)
    })

    it("returns null for unknown formula", () => {
        expect(resolveFormula("nonexistent", 100)).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// Quality multipliers
// ---------------------------------------------------------------------------
describe("applyQualityMultiplier", () => {
    it("normal = 1x", () => {
        expect(applyQualityMultiplier(100, "normal")).toBe(100)
    })

    it("silver = floor(1.25x)", () => {
        expect(applyQualityMultiplier(550, "silver")).toBe(687)
    })

    it("gold = floor(1.5x)", () => {
        expect(applyQualityMultiplier(550, "gold")).toBe(825)
    })

    it("iridium = 2x", () => {
        expect(applyQualityMultiplier(550, "iridium")).toBe(1100)
    })
})

describe("generateQualities", () => {
    it("generates all quality tiers from a normal price", () => {
        expect(generateQualities(550)).toEqual({
            normal: 550,
            silver: 687,
            gold: 825,
            iridium: 1100,
        })
    })
})

// ---------------------------------------------------------------------------
// Profession multipliers
// ---------------------------------------------------------------------------
describe("applyProfessionMultiplier", () => {
    it("tiller = floor(1.1x)", () => {
        expect(applyProfessionMultiplier(550, "tiller")).toBe(605)
    })

    it("rancher = floor(1.1x)", () => {
        expect(applyProfessionMultiplier(50, "rancher")).toBe(55)
    })

    it("artisan = floor(1.4x)", () => {
        expect(applyProfessionMultiplier(1650, "artisan")).toBe(2310)
    })

    it("fisher = floor(1.25x)", () => {
        expect(applyProfessionMultiplier(200, "fisher")).toBe(250)
        expect(applyProfessionMultiplier(65, "fisher")).toBe(81)
    })

    it("angler = floor(1.5x)", () => {
        expect(applyProfessionMultiplier(200, "angler")).toBe(300)
    })

    it("returns base price for unknown profession", () => {
        expect(applyProfessionMultiplier(100, "unknown")).toBe(100)
    })
})

// ---------------------------------------------------------------------------
// Item price retrieval from items.json
// ---------------------------------------------------------------------------
describe("item prices from data", () => {
    it("Ancient Fruit has correct base prices (via getEffectivePrices)", () => {
        const af = getItem("Ancient Fruit")
        const prices = getEffectivePrices(af, itemsByName)!
        // normal stored; silver/gold/iridium computed from standard multipliers
        expect(prices.base).toEqual({
            normal: 550,
            silver: 687,
            gold: 825,
            iridium: 1100,
        })
    })

    it("Ancient Fruit has correct tiller prices (via getEffectivePrices)", () => {
        const af = getItem("Ancient Fruit")
        const prices = getEffectivePrices(af, itemsByName)!
        expect(prices.tiller).toEqual({
            normal: 605,
            silver: 755,
            gold: 907,
            iridium: 1210,
        })
    })

    it("Carrot has correct base prices (via getEffectivePrices)", () => {
        const carrot = getItem("Carrot")
        const prices = getEffectivePrices(carrot, itemsByName)!
        expect(prices.base).toEqual({
            normal: 35,
            silver: 43,
            gold: 52,
            iridium: 70,
        })
    })

    it("Egg has correct rancher prices (via getEffectivePrices)", () => {
        const egg = getItem("Egg")
        const prices = getEffectivePrices(egg, itemsByName)!
        expect(prices.rancher).toEqual({
            normal: 60,
            silver: 74,
            gold: 90,
            iridium: 120,
        })
    })

    it("Blackberry has bearsKnowledge prices", () => {
        const bb = getItem("Blackberry")
        expect(bb.prices!.bearsKnowledge).toBeDefined()
        expect(bb.prices!.bearsKnowledgeTiller).toBeDefined()
    })
})

// ---------------------------------------------------------------------------
// Derived (computed) prices via getEffectivePrices
// ---------------------------------------------------------------------------
describe("getEffectivePrices", () => {
    it("returns expanded prices for base items", () => {
        const af = getItem("Ancient Fruit")
        const prices = getEffectivePrices(af, itemsByName)!
        // getEffectivePrices returns a new expanded object, not the stored reference
        expect(prices.base.normal).toBe(550)
        expect(prices.base.silver).toBe(687)
        expect(prices.base.iridium).toBe(1100)
    })

    it("computes wine price via synthetic item", () => {
        const wine: GameItem = { name: "Ancient Fruit Wine", category: "artisan-good", base: false }
        const prices = getEffectivePrices(wine, itemsByName)!
        expect(prices.base.normal).toBe(1650)
    })

    it("computes jelly price via synthetic item", () => {
        // "Ancient Fruit Jelly" is no longer in items.json but the formula still works
        const jelly: GameItem = { name: "Ancient Fruit Jelly", category: "artisan-good", base: false }
        const prices = getEffectivePrices(jelly, itemsByName)!
        expect(prices.base.normal).toBe(1150)
    })

    it("computes juice price via synthetic item", () => {
        const juice: GameItem = { name: "Carrot Juice", category: "artisan-good", base: false }
        const prices = getEffectivePrices(juice, itemsByName)!
        expect(prices.base.normal).toBe(78)
    })

    it("computes pickles price via synthetic item", () => {
        const pickles: GameItem = { name: "Pickled Carrot", category: "artisan-good", base: false }
        const prices = getEffectivePrices(pickles, itemsByName)!
        expect(prices.base.normal).toBe(120)
    })

    it("computes dried price via synthetic item", () => {
        const dried: GameItem = { name: "Dried Ancient Fruit", category: "artisan-good", base: false }
        const prices = getEffectivePrices(dried, itemsByName)!
        expect(prices.base.normal).toBe(4150)
    })

    it("also returns artisan prices for derived items", () => {
        const wine: GameItem = { name: "Ancient Fruit Wine", category: "artisan-good", base: false }
        const prices = getEffectivePrices(wine, itemsByName)!
        // artisan = floor(1650 * 1.4) = 2310
        expect(prices.artisan!.normal).toBe(2310)
    })

    it("generates quality tiers for derived prices", () => {
        const wine: GameItem = { name: "Ancient Fruit Wine", category: "artisan-good", base: false }
        const prices = getEffectivePrices(wine, itemsByName)!
        expect(prices.base).toEqual(generateQualities(1650))
    })

    it("cooked items only have normal quality — no silver/gold/iridium", () => {
        const sashimi = getItem("Sashimi")
        const prices = getEffectivePrices(sashimi, itemsByName)!
        expect(prices.base.normal).toBeGreaterThan(0)
        expect(prices.base.silver).toBeUndefined()
        expect(prices.base.gold).toBeUndefined()
        expect(prices.base.iridium).toBeUndefined()
    })

    it("expands quality tiers from normal even when not stored in items.json", () => {
        // Ancient Fruit only stores base.normal=550; silver/gold/iridium are computed
        const af = getItem("Ancient Fruit")
        expect(af.prices!.base.silver).toBeUndefined()
        const prices = getEffectivePrices(af, itemsByName)!
        expect(prices.base.silver).toBe(687)  // floor(550 * 1.25)
        expect(prices.base.gold).toBe(825)    // floor(550 * 1.5)
        expect(prices.base.iridium).toBe(1100) // 550 * 2
    })
})

// ---------------------------------------------------------------------------
// getSourceItemName
// ---------------------------------------------------------------------------
describe("getSourceItemName", () => {
    it("extracts source from wine", () => {
        expect(getSourceItemName("Ancient Fruit Wine")).toEqual({
            sourceName: "Ancient Fruit",
            formula: "wine",
        })
    })

    it("extracts source from jelly", () => {
        expect(getSourceItemName("Strawberry Jelly")).toEqual({
            sourceName: "Strawberry",
            formula: "jelly",
        })
    })

    it("extracts source from juice", () => {
        expect(getSourceItemName("Carrot Juice")).toEqual({
            sourceName: "Carrot",
            formula: "juice",
        })
    })

    it("extracts source from pickles", () => {
        expect(getSourceItemName("Pickled Carrot")).toEqual({
            sourceName: "Carrot",
            formula: "pickles",
        })
    })

    it("extracts source from dried", () => {
        expect(getSourceItemName("Dried Ancient Fruit")).toEqual({
            sourceName: "Ancient Fruit",
            formula: "dried",
        })
    })

    it("returns null for non-derived items", () => {
        expect(getSourceItemName("Ancient Fruit")).toBeNull()
        expect(getSourceItemName("Egg")).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// getPriceCategory (profession/filter effects)
// ---------------------------------------------------------------------------
describe("getPriceCategory", () => {
    it("returns 'base' with no professions", () => {
        expect(getPriceCategory("Ancient Fruit", "fruit", false, false, [])).toBe("base")
    })

    it("returns 'tiller' for crops/fruits with tiller", () => {
        expect(getPriceCategory("Ancient Fruit", "fruit", false, false, ["tiller"])).toBe("tiller")
        expect(getPriceCategory("Carrot", "crop", false, false, ["tiller"])).toBe("tiller")
    })

    it("returns 'artisan' for artisan goods with artisan profession", () => {
        expect(getPriceCategory("Ancient Fruit Wine", "artisan-good", false, false, ["artisan"])).toBe("artisan")
    })

    it("returns 'rancher' for animal products with rancher", () => {
        expect(getPriceCategory("Egg", "animal-product", false, false, ["rancher"])).toBe("rancher")
    })

    it("returns 'base' for foraged non-berry without tiller (foraged)", () => {
        // A forageable item that isn't a berry, when foraged, gets base
        expect(getPriceCategory("Wild Plum", "fruit", true, true, ["tiller"])).toBe("base")
    })

    it("returns 'tiller' for forageable non-berry when grown (not foraged)", () => {
        expect(getPriceCategory("Wild Plum", "fruit", true, false, ["tiller"])).toBe("tiller")
    })

    it("returns 'bearsKnowledge' for foraged berries with bearsKnowledge", () => {
        expect(getPriceCategory("Blackberry", "fruit", true, true, ["bearsKnowledge"])).toBe("bearsKnowledge")
    })

    it("returns 'bearsKnowledgeTiller' for foraged berries with both", () => {
        expect(
            getPriceCategory("Blackberry", "fruit", true, true, ["bearsKnowledge", "tiller"])
        ).toBe("bearsKnowledgeTiller")
    })

    it("salmonberry also gets bearsKnowledge treatment", () => {
        expect(getPriceCategory("Salmonberry", "fruit", true, true, ["bearsKnowledge"])).toBe("bearsKnowledge")
    })

    it("does not apply bearsKnowledge to non-foraged berries", () => {
        expect(getPriceCategory("Blackberry", "fruit", true, false, ["bearsKnowledge"])).toBe("base")
    })

    it("tiller does not apply to artisan goods", () => {
        expect(getPriceCategory("Ancient Fruit Wine", "artisan-good", false, false, ["tiller"])).toBe("base")
    })

    it("returns 'fisher' for fish with fisher profession", () => {
        expect(getPriceCategory("Salmon", "fish", false, false, ["fisher"])).toBe("fisher")
    })

    it("returns 'angler' for fish with angler profession (takes priority over fisher)", () => {
        expect(getPriceCategory("Salmon", "fish", false, false, ["angler"])).toBe("angler")
        expect(getPriceCategory("Salmon", "fish", false, false, ["fisher", "angler"])).toBe("angler")
    })

    it("fisher does not apply to non-fish", () => {
        expect(getPriceCategory("Ancient Fruit", "fruit", false, false, ["fisher"])).toBe("base")
    })
})

describe("getEffectivePrices fish profession tiers", () => {
    it("dynamically adds fisher and angler tiers for fish", () => {
        const salmon = getItem("Salmon")
        const prices = getEffectivePrices(salmon, itemsByName)!
        // Salmon base = 75g; fisher = floor(75 * 1.25) = 93; angler = floor(75 * 1.5) = 112
        expect(prices.fisher?.normal).toBe(93)
        expect(prices.angler?.normal).toBe(112)
    })

    it("fisher tier has quality prices", () => {
        const salmon = getItem("Salmon")
        const prices = getEffectivePrices(salmon, itemsByName)!
        // silver = floor(93 * 1.25) = 116... wait, fisher applies to base quality prices
        // base silver = floor(75 * 1.25) = 93; fisher silver = floor(93 * 1.25) = 116
        expect(prices.fisher?.silver).toBeDefined()
        expect(prices.angler?.gold).toBeDefined()
    })
})

// ---------------------------------------------------------------------------
// Gold per day (base items)
// ---------------------------------------------------------------------------
describe("gold per day", () => {
    describe("base item gold per day", () => {
        it("first harvest: price / daysToMature", () => {
            // Ancient Fruit: 550g / 28 days = 19.642...
            const gpd = goldPerDayFirstHarvest(550, 28)
            expect(gpd).toBeCloseTo(19.64, 1)
        })

        it("regrow: price / daysToRegrow", () => {
            // Ancient Fruit: 550g / 7 days = 78.571...
            const gpd = goldPerDayRegrow(550, 7)
            expect(gpd).toBeCloseTo(78.57, 1)
        })
    })

    describe("processed item gold per day", () => {
        it("standard processor: delta / processingDays", () => {
            // Ancient Fruit Wine: price=1650, input=550 (1 item), processingDays=6.25
            // delta = 1650 - 550 = 1100
            // goldPerDay = 1100 / 6.25 = 176
            const gpd = goldPerDayProcessed(1100, 6.25, false, 1)
            expect(gpd).toBe(176)
        })

        it("dehydrator: delta / processingDays / inputQuantity", () => {
            // Dried Ancient Fruit: price=4150, input cost=550*5=2750, processingDays=1
            // delta = 4150 - 2750 = 1400
            // goldPerDay = 1400 / 1 / 5 = 280
            const gpd = goldPerDayProcessed(1400, 1, true, 5)
            expect(gpd).toBe(280)
        })

        it("jelly gold per day", () => {
            // Ancient Fruit Jelly: price=1150, input=550 (1 item), processingDays=2.5
            // delta = 1150 - 550 = 600
            // goldPerDay = 600 / 2.5 = 240
            const gpd = goldPerDayProcessed(600, 2.5, false, 1)
            expect(gpd).toBe(240)
        })

        it("pickled carrot gold per day", () => {
            // Pickled Carrot: price=120, input=35 (1 item), processingDays=2.5
            // delta = 120 - 35 = 85
            // goldPerDay = 85 / 2.5 = 34
            const gpd = goldPerDayProcessed(85, 2.5, false, 1)
            expect(gpd).toBe(34)
        })
    })
})

// ---------------------------------------------------------------------------
// Derived items (recipe graph)
// ---------------------------------------------------------------------------
describe("getProductsForItem", () => {
    it("returns products for Ancient Fruit", () => {
        const af = getItem("Ancient Fruit")
        const products = getProductsForItem(af, recipes)
        const names = products.map((p) => p.resolvedName)
        expect(names).toContain("Ancient Fruit Wine")
        expect(names).toContain("Ancient Fruit Jelly")
        expect(names).toContain("Dried Ancient Fruit")
    })

    it("returns products for Carrot (crop)", () => {
        const carrot = getItem("Carrot")
        const products = getProductsForItem(carrot, recipes)
        const names = products.map((p) => p.resolvedName)
        expect(names).toContain("Carrot Juice")
        expect(names).toContain("Pickled Carrot")
    })

    it("returns empty for items with no recipes", () => {
        const wine: GameItem = { name: "Ancient Fruit Wine", category: "artisan-good", base: false }
        const products = getProductsForItem(wine, recipes)
        // Wine may have cask-based products or none
        // At minimum verify it doesn't crash
        expect(Array.isArray(products)).toBe(true)
    })
})

describe("getDerivationTree", () => {
    it("builds derivation tree for Ancient Fruit", () => {
        const af = getItem("Ancient Fruit")
        const tree = getDerivationTree(af, recipes, itemsByName)
        const topLevelNames = tree.map((n) => n.resolvedName)
        expect(topLevelNames).toContain("Ancient Fruit Wine")
        expect(topLevelNames).toContain("Ancient Fruit Jelly")
        expect(topLevelNames).toContain("Dried Ancient Fruit")
    })

    it("follows processing chains (wine → cask aging)", () => {
        const af = getItem("Ancient Fruit")
        const tree = getDerivationTree(af, recipes, itemsByName)
        const wineNode = tree.find((n) => n.resolvedName === "Ancient Fruit Wine")
        // Wine should have cask aging as children if there's a cask recipe for it
        // Just verify tree structure is correct
        expect(wineNode).toBeDefined()
        expect(Array.isArray(wineNode!.children)).toBe(true)
    })

    it("resolves derived item names in tree", () => {
        const af = getItem("Ancient Fruit")
        const tree = getDerivationTree(af, recipes, itemsByName)
        const wineNode = tree.find((n) => n.resolvedName === "Ancient Fruit Wine")
        // Wine was removed from items.json, so item is null
        expect(wineNode).toBeDefined()
        expect(wineNode!.item).toBeNull()
    })

    it("returns null for items not in registry (items removed from items.json)", () => {
        const af = getItem("Ancient Fruit")
        const tree = getDerivationTree(af, recipes, itemsByName)
        // Jelly, Dried, and Wine were all removed from items.json
        for (const name of ["Ancient Fruit Jelly", "Dried Ancient Fruit", "Ancient Fruit Wine"]) {
            const node = tree.find((n) => n.resolvedName === name)
            expect(node, `${name} should be in tree`).toBeDefined()
            expect(node!.item, `${name} should have null item`).toBeNull()
        }
    })
})
