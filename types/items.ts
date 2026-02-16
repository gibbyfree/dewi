export interface PriceQualities {
    normal: number
    silver?: number
    gold?: number
    iridium?: number
}

export interface GameItem {
    name: string
    description?: string
    prices: {
        base: PriceQualities
        tiller?: PriceQualities
        artisan?: PriceQualities
        bearsKnowledge?: PriceQualities
        bearsKnowledgeTiller?: PriceQualities
    }
    base: boolean
    color?: string
    spritePath?: string
    daysToMature?: number
    daysToRegrow?: number
    forageable?: boolean
}

export interface RecipeIngredient {
    name: string
    quantity: number
}

export interface RecipeProduct {
    name: string
    processor: string
    processingDays?: number
    outputQuantity?: number
    ingredients: RecipeIngredient[]
}

export interface Recipe {
    base: string
    products: RecipeProduct[]
}
