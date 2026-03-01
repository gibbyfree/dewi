import type { CaskAgingDays } from "@/types/items"

// Processor configuration
// Note: Processing times are specified per-recipe in recipes.json since they vary by input
export const processorConfig = {
    "Keg": {},
    "Preserves Jar": {},
    "Dehydrator": {},
    "Mill": {},
    "Oil Maker": {},
    "Mayonnaise Machine": {},
    "Cheese Press": {},
    "Cask": {},
    "Fish Smoker": {},
    "Fish Pond": {},
} as const

export type ProcessorName = keyof typeof processorConfig

// ---------------------------------------------------------------------------
// Cask aging schedules
// ---------------------------------------------------------------------------

// All wines share the same aging speed; the rest are specific items.
const WINE_AGING: CaskAgingDays = { silver: 14, gold: 28, iridium: 56 }

const caskAgingByName: Record<string, CaskAgingDays> = {
    "Beer": { silver: 7, gold: 14, iridium: 28 },
    "Cheese": { silver: 7, gold: 14, iridium: 28 },
    "Goat Cheese": { silver: 7, gold: 14, iridium: 28 },
    "Mead": { silver: 7, gold: 14, iridium: 28 },
    "Pale Ale": { silver: 8.5, gold: 17, iridium: 34 },
}

/** Look up cask aging days for an item by name. Returns undefined if not cask-eligible. */
export function getCaskAgingDays(itemName: string): CaskAgingDays | undefined {
    if (itemName.endsWith(" Wine")) return WINE_AGING
    return caskAgingByName[itemName]
}
