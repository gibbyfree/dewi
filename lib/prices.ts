import type { GameItem, ItemCategory, ItemPrices, PriceQualities } from "@/types/items"

/**
 * Named price formulas used across the game.
 * Each takes the input item's base normal-quality price and returns the output price.
 *
 * We use a registry rather than eval() for safety.
 */
type PriceFormula = (basePrice: number) => number

const formulaRegistry: Record<string, PriceFormula> = {
    // Fish Smoker: base * 1.5 (minimum +50g, but we'll keep it simple for now)
    "smoked_fish": (base) => Math.floor(base * 1.5),

    // Roe: 30 + floor(base / 2)
    "roe": (base) => 30 + Math.floor(base / 2),

    // Aged Roe: 2x roe price (input here is the roe price, not the fish price)
    "aged_roe": (base) => base * 2,

    // Wine: 3x base fruit price
    "wine": (base) => base * 3,

    // Juice: floor(2.25 * base)
    "juice": (base) => Math.floor(2.25 * base),

    // Jelly: 2 * base + 50
    "jelly": (base) => 2 * base + 50,

    // Pickles: 2 * base + 50
    "pickles": (base) => 2 * base + 50,

    // Dried: sell price = base * 7.5 + 25 (for 5 input items)
    "dried": (base) => Math.floor(base * 7.5 + 25),
}

/**
 * Resolve a price formula by name.
 * Returns the computed price, or null if the formula is unknown.
 */
export function resolveFormula(formulaName: string, inputBasePrice: number): number | null {
    const fn = formulaRegistry[formulaName]
    if (!fn) {
        console.warn(`Unknown price formula: ${formulaName}`)
        return null
    }
    return fn(inputBasePrice)
}

/**
 * Get quality multipliers used in Stardew Valley.
 * normal=1, silver=1.25, gold=1.5, iridium=2
 */
const QUALITY_MULTIPLIERS: Record<string, number> = {
    normal: 1,
    silver: 1.25,
    gold: 1.5,
    iridium: 2,
}

/**
 * Apply quality multiplier to a base price.
 */
export function applyQualityMultiplier(
    basePrice: number,
    quality: keyof PriceQualities
): number {
    return Math.floor(basePrice * (QUALITY_MULTIPLIERS[quality] ?? 1))
}

/**
 * Generate a full PriceQualities object from a base normal price + quality multipliers.
 */
export function generateQualities(normalPrice: number): PriceQualities {
    return {
        normal: normalPrice,
        silver: applyQualityMultiplier(normalPrice, "silver"),
        gold: applyQualityMultiplier(normalPrice, "gold"),
        iridium: applyQualityMultiplier(normalPrice, "iridium"),
    }
}

/**
 * Profession multipliers.
 */
const PROFESSION_MULTIPLIERS: Record<string, number> = {
    tiller: 1.1,
    rancher: 1.1,
    artisan: 1.4,
    angler: 1.5,
}

/**
 * Apply a profession multiplier to a base price.
 */
export function applyProfessionMultiplier(
    basePrice: number,
    profession: string
): number {
    const mult = PROFESSION_MULTIPLIERS[profession]
    if (!mult) return basePrice
    return Math.floor(basePrice * mult)
}

// --- Derived item price resolution ---

const DERIVED_NAME_PATTERNS: [RegExp, string][] = [
    [/^(.+) Wine$/, "wine"],
    [/^(.+) Jelly$/, "jelly"],
    [/^(.+) Juice$/, "juice"],
    [/^Pickled (.+)$/, "pickles"],
    [/^Dried (.+)$/, "dried"],
]

/**
 * Extract the source item name and formula from a derived item name.
 * e.g. "Ancient Fruit Wine" → { sourceName: "Ancient Fruit", formula: "wine" }
 */
export function getSourceItemName(derivedName: string): { sourceName: string; formula: string } | null {
    for (const [pattern, formula] of DERIVED_NAME_PATTERNS) {
        const match = derivedName.match(pattern)
        if (match) return { sourceName: match[1], formula }
    }
    return null
}

/**
 * Get effective prices for an item. If the item has stored prices, use them.
 * Otherwise, try to compute from formula based on the source item.
 */
export function getEffectivePrices(
    item: GameItem,
    itemsByName: Map<string, GameItem>
): ItemPrices | null {
    if (item.prices) return item.prices

    const source = getSourceItemName(item.name)
    if (!source) return null

    const sourceItem = itemsByName.get(source.sourceName)
    if (!sourceItem?.prices?.base) return null

    const normalPrice = resolveFormula(source.formula, sourceItem.prices.base.normal)
    if (normalPrice === null) return null

    return {
        base: generateQualities(normalPrice),
        artisan: generateQualities(Math.floor(normalPrice * 1.4)),
    }
}

// --- Price category resolution ---

export type PriceCategoryResult =
    | "base"
    | "tiller"
    | "bearsKnowledge"
    | "bearsKnowledgeTiller"
    | "artisan"
    | "rancher"
    | "angler"

/**
 * Determine which price category applies based on item properties and active professions.
 */
export function getPriceCategory(
    itemName: string,
    category: ItemCategory,
    isForageable: boolean,
    wasForaged: boolean,
    professions: string[]
): PriceCategoryResult {
    const hasTiller = professions.includes("tiller")
    const hasArtisan = professions.includes("artisan")
    const hasBearsKnowledge = professions.includes("bearsKnowledge")
    const hasRancher = professions.includes("rancher")
    const hasAngler = professions.includes("angler")

    const isBerry = itemName === "Blackberry" || itemName === "Salmonberry"

    // Fish use angler
    if (category === "fish" && hasAngler) return "angler"

    // Animal products use rancher
    if (category === "animal-product" && hasRancher) return "rancher"

    // Artisan goods use artisan
    if ((category === "artisan-good" || category === "processed") && hasArtisan) return "artisan"

    // Bear's knowledge for berries
    const bearsApplies = isBerry && wasForaged && hasBearsKnowledge
    const tillerApplies = hasTiller && (!isForageable || isBerry || !wasForaged)

    if (bearsApplies) return tillerApplies ? "bearsKnowledgeTiller" : "bearsKnowledge"
    if (tillerApplies && (category === "crop" || category === "fruit")) return "tiller"

    return "base"
}

// --- Gold per day helpers ---

/**
 * Gold per day for a base item (first harvest).
 */
export function goldPerDayFirstHarvest(price: number, daysToMature: number): number {
    return price / daysToMature
}

/**
 * Gold per day for a base item on regrow.
 */
export function goldPerDayRegrow(price: number, daysToRegrow: number): number {
    return price / daysToRegrow
}

/**
 * Gold per day for a derived/processed item.
 * delta = outputValue - inputCost
 * For dehydrator: divide by inputQuantity as well.
 */
export function goldPerDayProcessed(
    delta: number,
    processingDays: number,
    isDehydrator: boolean,
    inputQuantity: number
): number {
    const effectiveDays = processingDays || 1
    return isDehydrator
        ? delta / effectiveDays / inputQuantity
        : delta / effectiveDays
}
