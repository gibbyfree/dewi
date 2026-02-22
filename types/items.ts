export interface PriceQualities {
    normal: number
    silver?: number
    gold?: number
    iridium?: number
}

export type ItemCategory =
    | "crop"
    | "fruit"
    | "animal-product"
    | "fish"
    | "artisan-good"
    | "processed"

export interface CaskAgingDays {
    silver: number
    gold: number
    iridium: number
}

export interface GameItem {
    name: string
    description?: string
    prices: {
        base: PriceQualities
        tiller?: PriceQualities
        artisan?: PriceQualities
        rancher?: PriceQualities
        bearsKnowledge?: PriceQualities
        bearsKnowledgeTiller?: PriceQualities
        angler?: PriceQualities
    }
    category: ItemCategory
    base: boolean
    color?: string
    spritePath?: string
    caskAgingDays?: CaskAgingDays
    daysToMature?: number
    daysToRegrow?: number
    forageable?: boolean
}

// Recipe base can target a specific item name or a category
export type RecipeBase = string | { category: ItemCategory }

export interface RecipeIngredient {
    name: string
    quantity: number
}

export interface RecipeProduct {
    name: string
    processor: string
    processingDays?: number
    outputQuantity?: number
    outputQuality?: "normal" | "silver" | "gold" | "iridium"
    ingredients: RecipeIngredient[]
    // If set, output price is computed from input base price via a named formula
    priceFormula?: string
    // For category/tag-wide recipes: pattern for output name, e.g. "{input} Roe"
    nameTemplate?: string
    // For category/tag-wide recipes: pattern for sprite path
    spriteTemplate?: string
    // Static sprite override (e.g. one smoked fish sprite for all fish)
    staticSprite?: string
}

export interface Recipe {
    base: RecipeBase
    products: RecipeProduct[]
}
