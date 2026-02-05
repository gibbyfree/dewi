"use client"

import type { GameItem } from "./ItemSearch"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"

function formatPrices(prices: GameItem["prices"], professions: string[]): string {
    const parts: string[] = []

    for (const [category, qualities] of Object.entries(prices)) {
        if (category !== "base" && !professions.includes(category)) continue
        const qualityParts: string[] = []
        for (const [quality, price] of Object.entries(qualities)) {
            qualityParts.push(`${quality}: ${price}g`)
        }
        parts.push(`${category} (${qualityParts.join(", ")})`)
    }

    return parts.join(" ")
}

interface ItemDetailsProps {
    item: GameItem | null
    professions: string[]
}

export function ItemDetails({ item, professions }: ItemDetailsProps) {
    if (!item) return null

    return (
        <div className="mt-6 p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
            <p className="text-sm text-muted-foreground">
                {formatPrices(item.prices, professions)}
            </p>
        </div>
    )
}
