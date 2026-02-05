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
    }
    sprite: string
    base: boolean
    color?: string
}
