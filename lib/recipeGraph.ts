import type { GameItem, Recipe, RecipeProduct } from "@/types/items"

/**
 * Build a map from each item name to its canonical alias (first in each group).
 * e.g. "Large Egg" → "Egg", "Goat Milk" → "Milk"
 */
export function buildAliasMap(aliasGroups: string[][]): Map<string, string> {
    const map = new Map<string, string>()
    for (const group of aliasGroups) {
        const canonical = group[0]
        for (const name of group) {
            map.set(name, canonical)
        }
    }
    return map
}

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
 * Check if a recipe's base matches a given item, respecting ingredient aliases.
 * e.g. a recipe with base "Egg" will also match "Large Egg" if they share a canonical alias.
 */
function recipeMatchesItem(recipeBase: Recipe["base"], item: GameItem, aliasMap?: Map<string, string>): boolean {
    const itemCanonical = aliasMap?.get(item.name) ?? item.name
    if (typeof recipeBase === "string") {
        const baseCanonical = aliasMap?.get(recipeBase) ?? recipeBase
        return recipeBase === item.name || baseCanonical === itemCanonical
    }
    if (Array.isArray(recipeBase)) {
        return recipeBase.some(b => {
            const bCanonical = aliasMap?.get(b) ?? b
            return b === item.name || bCanonical === itemCanonical
        })
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
 *
 * When aliasMap is provided, alias-matched recipes are included but deduplicated:
 * if the item has a direct recipe for a given processor (e.g. Large Egg → gold Mayonnaise),
 * alias-matched recipes for that same processor are suppressed (e.g. Egg → Mayonnaise).
 */
export function getProductsForItem(
    item: GameItem,
    recipes: Recipe[],
    aliasMap?: Map<string, string>
): Array<{ product: RecipeProduct; resolvedName: string; resolvedSprite: string | null }> {
    type TaggedResult = {
        product: RecipeProduct
        resolvedName: string
        resolvedSprite: string | null
        direct: boolean
    }
    const tagged: TaggedResult[] = []

    for (const recipe of recipes) {
        const direct = recipeMatchesItem(recipe.base, item)
        if (!direct && !recipeMatchesItem(recipe.base, item, aliasMap)) continue

        for (const product of recipe.products) {
            const resolvedName = product.nameTemplate
                ? resolveTemplate(product.nameTemplate, item.name)
                : product.name
            const resolvedSprite = product.spriteTemplate
                ? resolveTemplateSlug(product.spriteTemplate, item.name)
                : product.staticSprite ?? null
            tagged.push({ product, resolvedName, resolvedSprite, direct })
        }
    }

    // Suppress alias matches for any processor that already has a direct match
    const directProcessors = new Set(tagged.filter(r => r.direct).map(r => r.product.processor))
    return tagged
        .filter(r => r.direct || !directProcessors.has(r.product.processor))
        .map(({ direct: _direct, ...rest }) => rest)
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
export function getRecipesForItem(item: GameItem, recipes: Recipe[], aliasMap?: Map<string, string>): Recipe[] {
    return recipes.filter(r => recipeMatchesItem(r.base, item, aliasMap))
}
