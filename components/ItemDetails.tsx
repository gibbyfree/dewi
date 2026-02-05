"use client"

import type { Item } from "./ItemSearch"

function formatPrices(prices: Item["prices"]): string {
    const parts: string[] = []

    for (const [category, qualities] of Object.entries(prices)) {
        const qualityParts: string[] = []
        for (const [quality, price] of Object.entries(qualities)) {
            qualityParts.push(`${quality}: ${price}g`)
        }
        parts.push(`${category} (${qualityParts.join(", ")})`)
    }

    return parts.join(" | ")
}

interface ItemDetailsProps {
    item: Item | null
}

export function ItemDetails({ item }: ItemDetailsProps) {
    if (!item) return null

    return (
        <div className="mt-6 p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
            <p className="text-sm text-muted-foreground">
                {formatPrices(item.prices)}
            </p>
        </div>
    )
}
