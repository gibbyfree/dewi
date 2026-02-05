"use client"

import Image from "next/image"
import type { GameItem } from "./ItemSearch"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import recipesData from "@/data/recipes.json"
import itemsData from "@/data/items.json"

const qualitySprites: Record<string, string> = {
    silver: "/sprites/silver.webp",
    gold: "/sprites/gold.webp",
    iridium: "/sprites/iridium.webp",
}

// Convert item name to sprite filename (e.g., "Ancient Fruit" -> "ancient-fruit.png")
function getItemSpritePath(itemName: string): string {
    return `/sprites/bases/${itemName.toLowerCase().replace(/\s+/g, "-")}.png`
}

// Convert processor name to sprite filename (e.g., "Preserves Jar" -> "preserves-jar.png")
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

interface ItemDetailsProps {
    item: GameItem | null
    professions: string[]
}

export function ItemDetails({ item, professions }: ItemDetailsProps) {
    if (!item) return null

    const itemSprite = getItemSpritePath(item.name)
    // If professions are selected, only show those. Otherwise show base.
    const categories = professions.length > 0
        ? professions.filter(p => item.prices[p as keyof typeof item.prices])
        : ["base"]

    // Find all recipes that use this item as base
    const recipeEntry = recipesData.recipes.find(r => r.base === item.name)
    const derivedItems = recipeEntry?.products.map(product => {
        const derivedItem = itemsData.items.find((i: GameItem) => i.name === product.name)
        return derivedItem ? { ...derivedItem, processor: product.processor } : null
    }).filter(Boolean) as (GameItem & { processor: string })[]

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
                <Image
                    src={itemSprite}
                    alt={item.name}
                    width={64}
                    height={64}
                />
                <h2 className="text-xl font-semibold">{item.name}</h2>
            </div>

            {categories.map(category => {
                const qualities = item.prices[category as keyof typeof item.prices]
                if (!qualities) return null

                return (
                    <div key={category}>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(qualities).map(([quality, price]) => (
                                <Item key={quality} variant="muted">
                                    <ItemContent>
                                        <ItemTitle className="capitalize flex items-center gap-2">
                                            <div className="relative w-16 h-16 flex items-center justify-center">
                                                <Image
                                                    src={itemSprite}
                                                    alt={item.name}
                                                    width={64}
                                                    height={64}
                                                />
                                                {qualitySprites[quality] && (
                                                    <Image
                                                        src={qualitySprites[quality]}
                                                        alt={quality}
                                                        width={64}
                                                        height={64}
                                                        className="absolute -bottom-6 -left-6"
                                                    />
                                                )}
                                            </div>
                                        </ItemTitle>
                                        <ItemDescription>{price}g</ItemDescription>
                                    </ItemContent>
                                </Item>
                            ))}
                        </div>
                    </div>
                )
            })}

            {derivedItems && derivedItems.length > 0 && (
                <div className="mt-6">
                    <div className="space-y-4">
                        {derivedItems.map(derivedItem => {
                            const baseColor = (item as GameItem).color || "red";
                            const derivedSprite = getDerivedSpritePath(baseColor, derivedItem.processor);
                            const processorSprite = getProcessorSpritePath(derivedItem.processor);

                            // Get the price for the selected category, or base price
                            const selectedCategory = categories[0] || "base";
                            const prices = derivedItem.prices[selectedCategory as keyof typeof derivedItem.prices];
                            const price = prices?.normal || 0;

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
                                            <ItemDescription>{price}g</ItemDescription>
                                        </ItemContent>
                                    </Item>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
