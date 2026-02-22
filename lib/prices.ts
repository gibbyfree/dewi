import type { PriceQualities } from "@/types/items"

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

    // Dried: sell price = base * 7.5 (for 5 input items, so effectively 1.5x per item)
    "dried": (base) => Math.floor(base * 7.5),
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
