"use client"

import Image from "next/image"
import type { GameItem } from "./ItemSearch"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import recipesData from "@/data/recipes.json"
import itemsData from "@/data/items.json"

// Convert processor name to sprite filename
function getProcessorSpritePath(processorName: string): string {
    return `/sprites/processors/${processorName.toLowerCase().replace(/\s+/g, "-")}.png`
}

// Get derived item sprite path based on color and processor type
function getDerivedSpritePath(color: string, processorName: string): string {
    const processorType = processorName === "Keg" ? "wine" :
        processorName === "Preserves Jar" ? "jelly" :
            processorName === "Dehydrator" ? "dried-fruit" : "unknown";
    return `/sprites/processedes/${color}-${processorType}.png`;
}

interface DerivedItemsProps {
    baseItem: GameItem
    professions: string[]
}

export function DerivedItems({ baseItem, professions }: DerivedItemsProps) {
    // Find all recipes that use this item as base
    const recipeEntry = recipesData.recipes.find(r => r.base === baseItem.name)
    const derivedItems = recipeEntry?.products.map(product => {
        const derivedItem = itemsData.items.find((i: GameItem) => i.name === product.name)
        return derivedItem ? { ...derivedItem, processor: product.processor } : null
    }).filter(Boolean) as (GameItem & { processor: string })[]

    if (!derivedItems || derivedItems.length === 0) return null

    // For derived items, use artisan if it's in professions, otherwise use base
    const category = professions.includes("artisan") ? "artisan" : "base"

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Derived Products</h3>
            <div className="space-y-4">
                {derivedItems.map(derivedItem => {
                    const baseColor = (baseItem as any).color || "red"
                    const derivedSprite = getDerivedSpritePath(baseColor, derivedItem.processor)
                    const processorSprite = getProcessorSpritePath(derivedItem.processor)

                    // Get the price for the selected category
                    const prices = derivedItem.prices[category as keyof typeof derivedItem.prices]
                    const price = prices?.normal || 0

                    return (
                        <div key={derivedItem.name} className="flex items-center gap-3">
                            <Image
                                src={processorSprite}
                                alt={derivedItem.processor}
                                width={48}
                                height={48}
                            />
                            <span className="text-2xl">→</span>
                            <Item variant="muted" className="flex-1">
                                <ItemContent>
                                    <ItemTitle className="flex items-center gap-2">
                                        <Image
                                            src={derivedSprite}
                                            alt={derivedItem.name}
                                            width={48}
                                            height={48}
                                        />
                                        <span>{derivedItem.name}</span>
                                    </ItemTitle>
                                    <ItemDescription className="text-lg font-semibold">{price}g</ItemDescription>
                                </ItemContent>
                            </Item>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
