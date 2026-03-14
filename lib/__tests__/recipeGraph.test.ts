/**
 * Edge-case and additional coverage for recipeGraph functions.
 * Uses synthetic data so tests don't break when items/recipes change.
 */
import { describe, it, expect } from "vitest"
import {
    getProductsForItem,
    getDerivationTree,
    buildItemIndex,
    getRecipesForItem,
    buildAliasMap,
} from "@/lib/recipeGraph"
import type { GameItem, Recipe } from "@/types/items"

// ---------------------------------------------------------------------------
// Helpers — synthetic items and recipes for isolated testing
// ---------------------------------------------------------------------------
function makeItem(overrides: Partial<GameItem> & { name: string }): GameItem {
    return {
        category: "crop",
        base: true,
        ...overrides,
    }
}

const syntheticItems: GameItem[] = [
    makeItem({
        name: "TestBerry",
        category: "fruit",
        prices: { base: { normal: 40 } },
    }),
    makeItem({
        name: "TestBerry Wine",
        category: "artisan-good",
        base: false,
    }),
    makeItem({
        name: "TestBerry Jelly",
        category: "artisan-good",
        base: false,
    }),
    makeItem({
        name: "TestVeggie",
        category: "crop",
        prices: { base: { normal: 60 } },
    }),
    makeItem({
        name: "TestVeggie Juice",
        category: "artisan-good",
        base: false,
    }),
    makeItem({
        name: "TestAnimal",
        category: "animal-product",
        prices: { base: { normal: 100 } },
    }),
]

const syntheticRecipes: Recipe[] = [
    {
        base: "TestBerry",
        products: [
            {
                name: "TestBerry Wine",
                processor: "Keg",
                processingDays: 6.25,
                ingredients: [{ name: "TestBerry", quantity: 1 }],
            },
            {
                name: "TestBerry Jelly",
                processor: "Preserves Jar",
                processingDays: 2.5,
                ingredients: [{ name: "TestBerry", quantity: 1 }],
            },
        ],
    },
    {
        base: "TestVeggie",
        products: [
            {
                name: "TestVeggie Juice",
                processor: "Keg",
                processingDays: 4,
                ingredients: [{ name: "TestVeggie", quantity: 1 }],
            },
        ],
    },
    {
        base: { category: "animal-product" },
        products: [
            {
                name: "",
                nameTemplate: "{input} Mayo",
                processor: "Mayonnaise Machine",
                processingDays: 1,
                ingredients: [{ name: "TestAnimal", quantity: 1 }],
            },
        ],
    },
    {
        base: ["TestBerry", "TestVeggie"],
        products: [
            {
                name: "TestDish",
                processor: "Kitchen",
                ingredients: [
                    { name: "TestBerry", quantity: 1 },
                    { name: "TestVeggie", quantity: 2 },
                ],
            },
        ],
    },
]

const syntheticIndex = buildItemIndex(syntheticItems)

// ---------------------------------------------------------------------------
// buildItemIndex
// ---------------------------------------------------------------------------
describe("buildItemIndex", () => {
    it("builds a map keyed by item name", () => {
        expect(syntheticIndex.size).toBe(syntheticItems.length)
        expect(syntheticIndex.get("TestBerry")).toBe(syntheticItems[0])
    })

    it("returns undefined for missing items", () => {
        expect(syntheticIndex.get("Nonexistent")).toBeUndefined()
    })

    it("handles empty array", () => {
        const empty = buildItemIndex([])
        expect(empty.size).toBe(0)
    })
})

// ---------------------------------------------------------------------------
// getProductsForItem — synthetic data
// ---------------------------------------------------------------------------
describe("getProductsForItem (synthetic)", () => {
    it("returns matching products for a string-based recipe base", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const products = getProductsForItem(berry, syntheticRecipes)
        expect(products).toHaveLength(3)
        expect(products.map((p) => p.resolvedName)).toEqual([
            "TestBerry Wine",
            "TestBerry Jelly",
            "TestDish",
        ])
    })

    it("returns products for category-based recipe base", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const products = getProductsForItem(animal, syntheticRecipes)
        expect(products).toHaveLength(1)
        expect(products[0].resolvedName).toBe("TestAnimal Mayo")
    })

    it("resolves nameTemplate with {input}", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const products = getProductsForItem(animal, syntheticRecipes)
        expect(products[0].resolvedName).toBe("TestAnimal Mayo")
    })

    it("returns empty array for items with no matching recipes", () => {
        const wine = syntheticIndex.get("TestBerry Wine")!
        const products = getProductsForItem(wine, syntheticRecipes)
        expect(products).toEqual([])
    })

    it("does not match a fruit to an animal-product category recipe", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const products = getProductsForItem(berry, syntheticRecipes)
        const names = products.map((p) => p.resolvedName)
        expect(names).not.toContain("TestBerry Mayo")
    })

    it("returns products for an item in an array-based recipe base", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const products = getProductsForItem(berry, syntheticRecipes)
        const names = products.map((p) => p.resolvedName)
        expect(names).toContain("TestDish")
    })

    it("returns products for all items in an array-based recipe base", () => {
        const veggie = syntheticIndex.get("TestVeggie")!
        const products = getProductsForItem(veggie, syntheticRecipes)
        const names = products.map((p) => p.resolvedName)
        expect(names).toContain("TestDish")
    })

    it("does not match an item not in the array-based recipe base", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const products = getProductsForItem(animal, syntheticRecipes)
        const names = products.map((p) => p.resolvedName)
        expect(names).not.toContain("TestDish")
    })
})

// ---------------------------------------------------------------------------
// getRecipesForItem
// ---------------------------------------------------------------------------
describe("getRecipesForItem (synthetic)", () => {
    it("finds recipes for string-based match", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const matched = getRecipesForItem(berry, syntheticRecipes)
        expect(matched).toHaveLength(2)
        expect(matched[0].base).toBe("TestBerry")
    })

    it("finds recipes for category-based match", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const matched = getRecipesForItem(animal, syntheticRecipes)
        expect(matched).toHaveLength(1)
    })

    it("returns empty for non-matching items", () => {
        const wine = syntheticIndex.get("TestBerry Wine")!
        const matched = getRecipesForItem(wine, syntheticRecipes)
        expect(matched).toEqual([])
    })

    it("finds array-based recipe for any item in the base array", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const matched = getRecipesForItem(berry, syntheticRecipes)
        const hasArrayRecipe = matched.some(r => Array.isArray(r.base))
        expect(hasArrayRecipe).toBe(true)
    })

    it("does not find array-based recipe for items outside the base array", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const matched = getRecipesForItem(animal, syntheticRecipes)
        const hasArrayRecipe = matched.some(r => Array.isArray(r.base))
        expect(hasArrayRecipe).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// getDerivationTree — synthetic data
// ---------------------------------------------------------------------------
describe("getDerivationTree (synthetic)", () => {
    it("builds tree for base item", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const tree = getDerivationTree(berry, syntheticRecipes, syntheticIndex)
        expect(tree).toHaveLength(3)
        expect(tree[0].resolvedName).toBe("TestBerry Wine")
        expect(tree[1].resolvedName).toBe("TestBerry Jelly")
        expect(tree[2].resolvedName).toBe("TestDish")
    })

    it("resolves items against index", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const tree = getDerivationTree(berry, syntheticRecipes, syntheticIndex)
        expect(tree[0].item).toBe(syntheticIndex.get("TestBerry Wine"))
    })

    it("sets item to null when derived item not in index", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const tree = getDerivationTree(animal, syntheticRecipes, syntheticIndex)
        // "TestAnimal Mayo" does not exist in syntheticItems
        expect(tree[0].resolvedName).toBe("TestAnimal Mayo")
        expect(tree[0].item).toBeNull()
    })

    it("does not recurse when item not in index (prevents infinite loops)", () => {
        const animal = syntheticIndex.get("TestAnimal")!
        const tree = getDerivationTree(animal, syntheticRecipes, syntheticIndex)
        expect(tree[0].children).toEqual([])
    })

    it("respects maxDepth = 0", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const tree = getDerivationTree(berry, syntheticRecipes, syntheticIndex, 0)
        expect(tree).toEqual([])
    })

    it("respects maxDepth = 1 (no children)", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const tree = getDerivationTree(berry, syntheticRecipes, syntheticIndex, 1)
        expect(tree).toHaveLength(3)
        // depth 1 = produce children array but with maxDepth=0 they'll be empty
        for (const node of tree) {
            expect(node.children).toEqual([])
        }
    })

    it("returns empty tree for leaf items", () => {
        const wine = syntheticIndex.get("TestBerry Wine")!
        const tree = getDerivationTree(wine, syntheticRecipes, syntheticIndex)
        expect(tree).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// spriteTemplate resolution
// ---------------------------------------------------------------------------
describe("sprite resolution", () => {
    it("resolves spriteTemplate with slugified input name", () => {
        const recipesWithSprite: Recipe[] = [
            {
                base: { category: "fruit" },
                products: [
                    {
                        name: "",
                        nameTemplate: "{input} Wine",
                        spriteTemplate: "/sprites/{input}-wine.png",
                        processor: "Keg",
                        ingredients: [{ name: "Test", quantity: 1 }],
                    },
                ],
            },
        ]
        const item = makeItem({ name: "Test Berry", category: "fruit" })
        const products = getProductsForItem(item, recipesWithSprite)
        expect(products[0].resolvedSprite).toBe("/sprites/test-berry-wine.png")
    })

    it("uses staticSprite when no spriteTemplate", () => {
        const recipesWithStatic: Recipe[] = [
            {
                base: "TestBerry",
                products: [
                    {
                        name: "TestBerry Smoked",
                        staticSprite: "/sprites/smoked.png",
                        processor: "Smoker",
                        ingredients: [{ name: "TestBerry", quantity: 1 }],
                    },
                ],
            },
        ]
        const berry = syntheticIndex.get("TestBerry")!
        const products = getProductsForItem(berry, recipesWithStatic)
        expect(products[0].resolvedSprite).toBe("/sprites/smoked.png")
    })

    it("returns null when no sprite info", () => {
        const berry = syntheticIndex.get("TestBerry")!
        const products = getProductsForItem(berry, syntheticRecipes)
        // syntheticRecipes have no sprite templates
        expect(products[0].resolvedSprite).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// buildAliasMap + alias-aware matching
// ---------------------------------------------------------------------------
describe("buildAliasMap and alias matching", () => {
    const aliasGroups = [["Egg", "Large Egg", "Duck Egg"], ["Milk", "Large Milk"]]
    const aliasMap = buildAliasMap(aliasGroups)

    const eggRecipe: Recipe = {
        base: "Egg",
        products: [{ name: "Fried Egg", processor: "Kitchen", ingredients: [{ name: "Egg", quantity: 1 }] }],
    }
    const multiRecipe: Recipe = {
        base: ["Egg", "Milk"],
        products: [{ name: "Omelet", processor: "Kitchen", ingredients: [{ name: "Egg", quantity: 1 }, { name: "Milk", quantity: 1 }] }],
    }

    const egg = makeItem({ name: "Egg", category: "animal-product" })
    const largeEgg = makeItem({ name: "Large Egg", category: "animal-product" })
    const duckEgg = makeItem({ name: "Duck Egg", category: "animal-product" })
    const milk = makeItem({ name: "Milk", category: "animal-product" })
    const largeMilk = makeItem({ name: "Large Milk", category: "animal-product" })

    it("maps each alias to the canonical name", () => {
        expect(aliasMap.get("Egg")).toBe("Egg")
        expect(aliasMap.get("Large Egg")).toBe("Egg")
        expect(aliasMap.get("Duck Egg")).toBe("Egg")
        expect(aliasMap.get("Large Milk")).toBe("Milk")
    })

    it("string base matches aliases", () => {
        expect(getProductsForItem(egg, [eggRecipe], aliasMap)).toHaveLength(1)
        expect(getProductsForItem(largeEgg, [eggRecipe], aliasMap)).toHaveLength(1)
        expect(getProductsForItem(duckEgg, [eggRecipe], aliasMap)).toHaveLength(1)
        expect(getProductsForItem(milk, [eggRecipe], aliasMap)).toHaveLength(0)
    })

    it("array base matches aliases", () => {
        expect(getProductsForItem(largeEgg, [multiRecipe], aliasMap)).toHaveLength(1)
        expect(getProductsForItem(largeMilk, [multiRecipe], aliasMap)).toHaveLength(1)
    })

    it("no alias map — only exact matches", () => {
        expect(getProductsForItem(largeEgg, [eggRecipe])).toHaveLength(0)
        expect(getProductsForItem(egg, [eggRecipe])).toHaveLength(1)
    })

    it("direct match suppresses alias match for the same processor", () => {
        // Large Egg has its own Mayonnaise Machine recipe → alias Egg→Mayonnaise should be excluded
        const eggMayoRecipe: Recipe = {
            base: "Egg",
            products: [{ name: "Mayonnaise", processor: "Mayonnaise Machine", ingredients: [{ name: "Egg", quantity: 1 }] }],
        }
        const largeEggDirectRecipe: Recipe = {
            base: "Large Egg",
            products: [{ name: "Mayonnaise", processor: "Mayonnaise Machine", ingredients: [{ name: "Large Egg", quantity: 1 }], outputQuality: "gold" }],
        }
        const results = getProductsForItem(largeEgg, [eggMayoRecipe, largeEggDirectRecipe], aliasMap)
        // Only the direct Large Egg recipe should appear, not the alias Egg recipe
        expect(results).toHaveLength(1)
        expect(results[0].product.outputQuality).toBe("gold")
    })

    it("alias match is kept when no direct match exists for that processor", () => {
        // Duck Egg has a direct Mayonnaise Machine recipe (Duck Mayo), so alias Egg recipe excluded
        // But for a different processor (Kitchen), alias matches are kept
        const duckDirectRecipe: Recipe = {
            base: "Duck Egg",
            products: [{ name: "Duck Mayonnaise", processor: "Mayonnaise Machine", ingredients: [{ name: "Duck Egg", quantity: 1 }] }],
        }
        const kitchenRecipe: Recipe = {
            base: "Egg",
            products: [{ name: "Fried Egg", processor: "Kitchen", ingredients: [{ name: "Egg", quantity: 1 }] }],
        }
        const results = getProductsForItem(duckEgg, [eggRecipe, duckDirectRecipe, kitchenRecipe], aliasMap)
        const names = results.map(r => r.resolvedName)
        expect(names).toContain("Duck Mayonnaise")   // direct
        expect(names).not.toContain("Mayonnaise")    // suppressed (same processor as direct)
        expect(names).toContain("Fried Egg")         // alias kept (different processor)
    })
})
