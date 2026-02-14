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
