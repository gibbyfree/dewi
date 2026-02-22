import type { GameItem, Recipe, RecipeProduct } from "@/types/items"

/**
 * A node in the derivation tree for an item.
 * Represents one processing step and its output.
 */
export interface DerivationNode {
    /** The resolved output item (if it exists in items.json) */
    item: GameItem | null
    /** The recipe product definition that produced this node */
    product: RecipeProduct
    /** The resolved output name (after template substitution) */
    resolvedName: string
    /** The resolved sprite path (after template substitution) */
    resolvedSprite: string | null
    /** Further processing steps available on this output */
    children: DerivationNode[]
}

/**
 * Check if a recipe's base matches a given item.
 */
function recipeMatchesItem(recipeBase: Recipe["base"], item: GameItem): boolean {
    if (typeof recipeBase === "string") {
        return recipeBase === item.name
    }
    if ("category" in recipeBase) {
        return recipeBase.category === item.category
    }
    return false
}

/**
 * Resolve template strings, replacing {input} with the item name.
 */
function resolveTemplate(template: string, inputName: string): string {
    return template.replace(/\{input\}/g, inputName)
}

/**
 * Resolve template strings for sprite paths, using a slug version of the name.
 */
function resolveTemplateSlug(template: string, inputName: string): string {
    const slug = inputName.toLowerCase().replace(/\s+/g, "-")
    return template.replace(/\{input\}/g, slug)
}

/**
 * Get all recipe products applicable to a given item, with resolved names and sprites.
 */
export function getProductsForItem(
    item: GameItem,
    recipes: Recipe[]
): Array<{ product: RecipeProduct; resolvedName: string; resolvedSprite: string | null }> {
    const results: Array<{
        product: RecipeProduct
        resolvedName: string
        resolvedSprite: string | null
    }> = []

    for (const recipe of recipes) {
        if (!recipeMatchesItem(recipe.base, item)) continue

        for (const product of recipe.products) {
            const resolvedName = product.nameTemplate
                ? resolveTemplate(product.nameTemplate, item.name)
                : product.name

            const resolvedSprite = product.spriteTemplate
                ? resolveTemplateSlug(product.spriteTemplate, item.name)
                : product.staticSprite ?? null

            results.push({ product, resolvedName, resolvedSprite })
        }
    }

    return results
}

/**
 * Build a full derivation tree for an item, following processing chains.
 *
 * Examples:
 *   Unmilled Rice → Rice (Mill) → Vinegar (Keg)
 *   Starfruit → Starfruit Wine (Keg) → Iridium Starfruit Wine (Cask)
 *   Sturgeon → Sturgeon Roe (Fish Pond) → Caviar (Preserves Jar)
 */
export function getDerivationTree(
    item: GameItem,
    recipes: Recipe[],
    itemsByName: Map<string, GameItem>,
    maxDepth: number = 3
): DerivationNode[] {
    if (maxDepth <= 0) return []

    const products = getProductsForItem(item, recipes)
    const nodes: DerivationNode[] = []

    for (const { product, resolvedName, resolvedSprite } of products) {
        // Try to find the derived item in the items registry
        const derivedItem = itemsByName.get(resolvedName) ?? null

        // Only recurse if we found a real item to prevent infinite loops
        const children = derivedItem
            ? getDerivationTree(derivedItem, recipes, itemsByName, maxDepth - 1)
            : []

        nodes.push({
            item: derivedItem,
            product,
            resolvedName,
            resolvedSprite,
            children,
        })
    }

    return nodes
}

/**
 * Build a Map of items by name for fast lookup.
 */
export function buildItemIndex(items: GameItem[]): Map<string, GameItem> {
    return new Map(items.map(i => [i.name, i]))
}

/**
 * Find all recipes whose base matches a given item.
 */
export function getRecipesForItem(item: GameItem, recipes: Recipe[]): Recipe[] {
    return recipes.filter(r => recipeMatchesItem(r.base, item))
}
