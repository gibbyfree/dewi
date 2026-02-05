"use client"

import Image from "next/image"
import type { GameItem } from "@/types/items"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import recipesData from "@/data/recipes.json"
import itemsData from "@/data/items.json"
import { processorConfig } from "@/config/processors"

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
    selectedBasePrice: number
}

export function DerivedItems({ baseItem, professions, selectedBasePrice }: DerivedItemsProps) {
    // Find all recipes that use this item as base
    const recipeEntry = recipesData.recipes.find(r => r.base === baseItem.name)
    const derivedItems = recipeEntry?.products.map(product => {
        const derivedItem = itemsData.items.find((i: GameItem) => i.name === product.name)
        const quantity = product.ingredients[0]?.quantity || 1
        return derivedItem ? { ...derivedItem, processor: product.processor, quantity } : null
    }).filter(Boolean) as (GameItem & { processor: string; quantity: number })[]

    if (!derivedItems || derivedItems.length === 0) return null

    // For derived items, use artisan if it's in professions, otherwise use base
    const category = professions.includes("artisan") ? "artisan" : "base"

    return (
        <div className="mt-6">
            <div className="space-y-4">
                {derivedItems.map(derivedItem => {
                    const baseColor = (baseItem as GameItem).color || "red"
                    const derivedSprite = getDerivedSpritePath(baseColor, derivedItem.processor)
                    const processorSprite = getProcessorSpritePath(derivedItem.processor)

                    // Get the price for the selected category
                    const prices = derivedItem.prices[category as keyof typeof derivedItem.prices]
                    const price = prices?.normal || 0

                    // Calculate delta from selected base price, accounting for quantity needed
                    const totalBaseCost = selectedBasePrice * derivedItem.quantity
                    const delta = selectedBasePrice > 0 ? price - totalBaseCost : 0
                    const deltaText = delta > 0 ? `+${delta}g` : delta < 0 ? `${delta}g` : "0g"

                    // Calculate gold per day (normalized per input item for fair comparison)
                    const processingDays = processorConfig[derivedItem.processor as keyof typeof processorConfig]?.processingDays || 1
                    const goldPerDay = delta / processingDays / derivedItem.quantity
                    const goldPerDayText = goldPerDay > 0 ? `${Math.round(goldPerDay)}g/item/day` : ""
                    const deltaColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600"

                    return (
                        <div key={derivedItem.name} className="flex items-center gap-3">
                            <div className="relative">
                                <Image
                                    src={processorSprite}
                                    alt={derivedItem.processor}
                                    width={48}
                                    height={48}
                                />
                                {derivedItem.quantity > 1 && (
                                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {derivedItem.quantity}
                                    </div>
                                )}
                            </div>
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
                                    <ItemDescription className="text-lg font-semibold">
                                        {price}g
                                        {selectedBasePrice > 0 && (
                                            <span className={`ml-2 text-sm ${deltaColor}`}>
                                                ({deltaText})
                                            </span>
                                        )}
                                        {selectedBasePrice > 0 && goldPerDayText && (
                                            <span className="ml-2 text-sm text-blue-600">
                                                {goldPerDayText}
                                            </span>
                                        )}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
