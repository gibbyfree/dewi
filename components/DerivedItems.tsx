"use client"

import Image from "next/image"
import type { GameItem, Recipe, RecipeProduct } from "@/types/items"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import recipesData from "@/data/recipes.json"
import itemsData from "@/data/items.json"

// Set of fruits (others default to vegetable)
const FRUITS = new Set([
    "Ancient Fruit",
    "Apple",
    "Apricot",
    "Banana",
    "Blackberry",
    "Blueberry",
    "Cherry",
    "Coconut",
    "Cranberries",
    "Crystal Fruit",
    "Grape",
    "Hot Pepper",
    "Melon",
    "Orange",
    "Peach",
    "Pineapple",
    "Pomegranate",
    "Powdermelon",
    "Rhubarb",
    "Salmonberry",
    "Spice Berry",
    "Starfruit",
    "Strawberry",
    "Wild Plum",
])

// Convert processor name to sprite filename
function getProcessorSpritePath(processorName: string): string {
    return `/sprites/processors/${processorName.toLowerCase().replace(/\s+/g, "-")}.png`
}

// Get derived item sprite path based on color, processor type, and whether base is a fruit
function getDerivedSpritePath(color: string, processorName: string, baseName: string): string {
    const isFruit = FRUITS.has(baseName)
    let processorType: string
    if (processorName === "Keg") {
        processorType = isFruit ? "wine" : "juice"
    } else if (processorName === "Preserves Jar") {
        processorType = isFruit ? "jelly" : "pickles"
    } else if (processorName === "Dehydrator") {
        processorType = "dried-fruit"
    } else if (processorName === "Oil Maker") {
        processorType = "oil-maker"
    } else {
        processorType = "unknown"
    }
    return `/sprites/processedes/${color}-${processorType}.png`;
}

interface DerivedItemsProps {
    baseItem: GameItem
    professions: string[]
    selectedBasePrice: number
}

export function DerivedItems({ baseItem, professions, selectedBasePrice }: DerivedItemsProps) {
    // Find all recipes that use this item as base
    const recipeEntry = recipesData.recipes.find(r => r.base === baseItem.name) as Recipe | undefined
    const derivedItems = recipeEntry?.products.map((product: RecipeProduct) => {
        const derivedItem = itemsData.items.find((i: GameItem) => i.name === product.name)
        const inputQuantity = product.ingredients[0]?.quantity || 1
        const outputQuantity = product.outputQuantity || 1
        const outputQuality = product.outputQuality || "normal"
        const processingDays = product.processingDays
        return derivedItem ? { ...derivedItem, processor: product.processor, inputQuantity, outputQuantity, outputQuality, processingDays } : null
    }).filter(Boolean) as (GameItem & { processor: string; inputQuantity: number; outputQuantity: number; outputQuality: string; processingDays?: number })[]

    if (!derivedItems || derivedItems.length === 0) return null

    // For derived items, use artisan if it's in professions, otherwise use base
    const category = professions.includes("artisan") ? "artisan" : "base"

    return (
        <div className="mt-6">
            <div className="space-y-4">
                {derivedItems.map(derivedItem => {
                    const baseColor = (baseItem as GameItem).color || "red"
                    const derivedSprite = derivedItem.spritePath || getDerivedSpritePath(baseColor, derivedItem.processor, baseItem.name)
                    const processorSprite = getProcessorSpritePath(derivedItem.processor)

                    // Get the price for the selected category and output quality
                    const prices = derivedItem.prices[category as keyof typeof derivedItem.prices]
                    const price = prices?.[derivedItem.outputQuality as keyof typeof prices] || prices?.normal || 0

                    // Calculate delta accounting for input quantity and output quantity
                    const totalBaseCost = selectedBasePrice * derivedItem.inputQuantity
                    const totalOutputValue = price * derivedItem.outputQuantity
                    const delta = selectedBasePrice > 0 ? totalOutputValue - totalBaseCost : 0
                    const deltaText = delta > 0 ? `+${delta}g` : delta < 0 ? `${delta}g` : "0g"

                    // Calculate gold per day - processing days should be specified in recipe
                    // Fallback to 1 day if not specified (but all recipes should specify it)
                    const processingDays = derivedItem.processingDays ?? 1
                    const isDehydrator = derivedItem.processor === "Dehydrator"

                    // For dehydrator, normalize per input item; for others, show total g/day
                    const goldPerDay = isDehydrator
                        ? delta / processingDays / derivedItem.inputQuantity
                        : delta / processingDays
                    const goldPerDayText = goldPerDay > 0
                        ? `${Math.round(goldPerDay)}g${isDehydrator ? '/item' : ''}/day`
                        : ""
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
                                {derivedItem.inputQuantity > 1 && (
                                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {derivedItem.inputQuantity}
                                    </div>
                                )}
                            </div>
                            <span className="text-2xl">→</span>
                            <Item variant="muted" className="flex-1">
                                <ItemContent>
                                    <ItemTitle className="flex items-center gap-2">
                                        <div className="relative">
                                            <Image
                                                src={derivedSprite}
                                                alt={derivedItem.name}
                                                width={48}
                                                height={48}
                                            />
                                            {derivedItem.outputQuantity > 1 && (
                                                <div className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                    {derivedItem.outputQuantity}
                                                </div>
                                            )}
                                        </div>
                                        <span>{derivedItem.name}</span>
                                    </ItemTitle>
                                    <ItemDescription className="text-lg font-semibold">
                                        {price}g{derivedItem.outputQuantity > 1 && <span className="text-xs text-gray-500">/ea</span>}
                                        {selectedBasePrice > 0 && (
                                            <span className={`ml-2 text-sm ${deltaColor}`}>
                                                ({deltaText})
                                            </span>
                                        )}
                                        {selectedBasePrice > 0 && goldPerDayText && (
                                            <span className="ml-2 text-xs text-gray-500">
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
