"use client"

import Image from "next/image"
import type { GameItem, Recipe } from "@/types/items"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import recipesData from "@/data/recipes.json"
import itemsData from "@/data/items.json"
import { getProductsForItem, buildItemIndex } from "@/lib/recipeGraph"

const recipes = recipesData.recipes as unknown as Recipe[]
const items = itemsData.items as GameItem[]
const itemsByName = buildItemIndex(items)

// Convert processor name to sprite filename
function getProcessorSpritePath(processorName: string): string {
    return `/sprites/processors/${processorName.toLowerCase().replace(/\s+/g, "-")}.png`
}

// Get derived item sprite path based on color, processor type, and base category
function getDerivedSpritePath(color: string, processorName: string, baseItem: GameItem): string {
    const isFruit = baseItem.category === "fruit"
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

    if (color) {
        return `/sprites/processedes/${color}/${color}-${processorType}.png`
    }
    return `/sprites/processedes/${color}-${processorType}.png`
}

interface DerivedItemsProps {
    baseItem: GameItem
    professions: string[]
    selectedBasePrice: number
    selectedQuality: string
    onNavigateToItem?: (item: GameItem) => void
}

export function DerivedItems({ baseItem, professions, selectedBasePrice, selectedQuality, onNavigateToItem }: DerivedItemsProps) {
    const resolvedProducts = getProductsForItem(baseItem, recipes)

    // Also check if this item itself is cask-eligible (e.g. when navigating to a wine)
    const hasCaskAging = !!baseItem.caskAgingDays
    const hasRecipeProducts = resolvedProducts.length > 0

    if (!hasRecipeProducts && !hasCaskAging) return null

    // For derived items, use artisan if it's in professions, otherwise use base
    const category = professions.includes("artisan") ? "artisan" : "base"

    return (
        <div className="mt-6">
            <div className="space-y-4">
                {resolvedProducts.map(({ product, resolvedName, resolvedSprite }) => {
                    const derivedItem = itemsByName.get(resolvedName) ?? null
                    const inputQuantity = product.ingredients[0]?.quantity || 1
                    const outputQuantity = product.outputQuantity || 1
                    const processingDays = product.processingDays

                    // Determine sprite
                    let derivedSpriteUrl: string
                    if (resolvedSprite) {
                        derivedSpriteUrl = resolvedSprite
                    } else if (derivedItem?.spritePath) {
                        derivedSpriteUrl = derivedItem.spritePath
                    } else {
                        const baseColor = baseItem.color || "red"
                        derivedSpriteUrl = getDerivedSpritePath(baseColor, product.processor, baseItem)
                    }

                    // Get the normal-quality price for the derived item
                    let price = 0
                    if (derivedItem) {
                        const prices = derivedItem.prices[category as keyof typeof derivedItem.prices]
                        price = prices?.normal || 0
                    }

                    // Calculate delta accounting for input quantity and output quantity
                    const totalBaseCost = selectedBasePrice * inputQuantity
                    const totalOutputValue = price * outputQuantity
                    const delta = selectedBasePrice > 0 ? totalOutputValue - totalBaseCost : 0
                    const deltaText = delta > 0 ? `+${delta}g` : delta < 0 ? `${delta}g` : "0g"

                    // Gold per day calculation
                    const effectiveProcessingDays = processingDays ?? 1
                    const isDehydrator = product.processor === "Dehydrator"
                    const goldPerDay = isDehydrator
                        ? delta / effectiveProcessingDays / inputQuantity
                        : delta / effectiveProcessingDays
                    const goldPerDayText = goldPerDay > 0
                        ? `${Math.round(goldPerDay)}g${isDehydrator ? '/item' : ''}/day`
                        : ""
                    const deltaColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600"

                    const displayName = resolvedName || product.name
                    const isClickable = !!derivedItem && !!onNavigateToItem

                    return (
                        <div key={`${resolvedName}-${product.processor}`} className="flex items-center gap-3">
                            <div className="relative">
                                <Image
                                    src={getProcessorSpritePath(product.processor)}
                                    alt={product.processor}
                                    width={48}
                                    height={48}
                                />
                                {inputQuantity > 1 && (
                                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {inputQuantity}
                                    </div>
                                )}
                            </div>
                            <span className="text-2xl">→</span>
                            <Item
                                variant="muted"
                                className={`flex-1 ${isClickable ? 'cursor-pointer hover:ring-1 hover:ring-primary' : ''}`}
                                onClick={isClickable ? () => onNavigateToItem!(derivedItem!) : undefined}
                            >
                                <ItemContent>
                                    <ItemTitle className="flex items-center gap-2">
                                        <div className="relative">
                                            <Image
                                                src={derivedSpriteUrl}
                                                alt={displayName}
                                                width={48}
                                                height={48}
                                            />
                                            {outputQuantity > 1 && (
                                                <div className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                    {outputQuantity}
                                                </div>
                                            )}
                                        </div>
                                        <span>{displayName}</span>
                                    </ItemTitle>
                                    <ItemDescription className="text-lg font-semibold">
                                        {price > 0 && (
                                            <>
                                                {price}g{outputQuantity > 1 && <span className="text-xs text-gray-500">/ea</span>}
                                            </>
                                        )}
                                        {selectedBasePrice > 0 && price > 0 && (
                                            <span className={`ml-2 text-sm ${deltaColor}`}>
                                                ({deltaText})
                                            </span>
                                        )}
                                        {selectedBasePrice > 0 && goldPerDayText && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                {goldPerDayText}
                                            </span>
                                        )}
                                        {processingDays !== undefined && processingDays > 0 && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                {processingDays}d
                                            </span>
                                        )}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        </div>
                    )
                })}

                {/* Cask aging section — shown when the item itself has caskAgingDays */}
                {hasCaskAging && <CaskAgingSection item={baseItem} category={category} selectedQuality={selectedQuality} />}
            </div>
        </div>
    )
}

const qualityOrder = ["normal", "silver", "gold", "iridium"] as const
const qualitySprites: Record<string, string> = {
    silver: "/sprites/silver.webp",
    gold: "/sprites/gold.webp",
    iridium: "/sprites/iridium.webp",
}

// Map item name patterns to processed sprite type suffixes
const DERIVED_SPRITE_SUFFIXES: [RegExp, string][] = [
    [/ Wine$/, "wine"],
    [/ Jelly$/, "jelly"],
    [/ Juice$/, "juice"],
    [/^Pickled /, "pickles"],
    [/^Dried /, "dried-fruit"],
]

function getItemSprite(item: GameItem): string | null {
    if (item.spritePath) return item.spritePath
    if (item.color) {
        for (const [pattern, suffix] of DERIVED_SPRITE_SUFFIXES) {
            if (pattern.test(item.name)) {
                return `/sprites/processedes/${item.color}/${item.color}-${suffix}.png`
            }
        }
    }
    return null
}

function CaskAgingSection({ item, category, selectedQuality }: { item: GameItem; category: string; selectedQuality: string }) {
    const cask = item.caskAgingDays!
    const prices = item.prices[category as keyof typeof item.prices]
    const selectedIdx = qualityOrder.indexOf(selectedQuality as typeof qualityOrder[number])
    const selectedPrice = prices?.[selectedQuality as keyof typeof prices] || prices?.normal || 0
    const itemSprite = getItemSprite(item)

    // Only show qualities above the currently selected one
    const qualitiesToShow = (["silver", "gold", "iridium"] as const).filter(q => {
        const idx = qualityOrder.indexOf(q)
        return idx > selectedIdx
    })

    if (qualitiesToShow.length === 0) return null

    return (
        <>
            {qualitiesToShow.map(quality => {
                const qualityPrice = prices?.[quality] || 0
                if (!qualityPrice) return null
                const days = cask[quality]
                const delta = qualityPrice - selectedPrice
                const deltaText = delta > 0 ? `+${delta}g` : `${delta}g`
                const goldPerDay = days > 0 ? delta / days : 0
                const goldPerDayText = goldPerDay > 0 ? `${Math.round(goldPerDay)}g/day` : ""

                return (
                    <div key={`cask-${quality}`} className="flex items-center gap-3">
                        <div className="relative">
                            <Image
                                src={getProcessorSpritePath("Cask")}
                                alt="Cask"
                                width={48}
                                height={48}
                            />
                        </div>
                        <span className="text-2xl">→</span>
                        <Item variant="muted" className="flex-1">
                            <ItemContent>
                                <ItemTitle className="flex items-center gap-2">
                                    {itemSprite && (
                                        <div className="relative w-12 h-12 flex items-center justify-center">
                                            <Image
                                                src={itemSprite}
                                                alt={item.name}
                                                width={48}
                                                height={48}
                                            />
                                            <Image
                                                src={qualitySprites[quality]}
                                                alt={quality}
                                                width={48}
                                                height={48}
                                                className="absolute -bottom-4 -left-4"
                                            />
                                        </div>
                                    )}
                                    <span>{item.name}</span>
                                </ItemTitle>
                                <ItemDescription className="text-lg font-semibold">
                                    {qualityPrice}g
                                    {selectedPrice > 0 && (
                                        <span className={`ml-2 text-sm ${delta > 0 ? "text-green-600" : "text-gray-600"}`}>
                                            ({deltaText})
                                        </span>
                                    )}
                                    {goldPerDayText && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            {goldPerDayText}
                                        </span>
                                    )}
                                    <span className="ml-2 text-xs text-gray-400">
                                        {days}d
                                    </span>
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    </div>
                )
            })}
        </>
    )
}
