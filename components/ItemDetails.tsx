"use client"

import { useState } from "react"
import Image from "next/image"
import type { GameItem } from "@/types/items"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DerivedItems } from "./DerivedItems"

const qualitySprites: Record<string, string> = {
    silver: "/sprites/silver.webp",
    gold: "/sprites/gold.webp",
    iridium: "/sprites/iridium.webp",
}

// Convert item name to sprite filename (e.g., "Ancient Fruit" -> "ancient-fruit.png")
function getItemSpritePath(itemName: string): string {
    return `/sprites/bases/${itemName.toLowerCase().replace(/\s+/g, "-")}.png`
}

interface ItemDetailsProps {
    item: GameItem
    professions: string[]
}

export function ItemDetails({ item, professions }: ItemDetailsProps) {
    return <ItemDetailsInner key={item.name} item={item} professions={professions} />
}

function ItemDetailsInner({ item, professions }: ItemDetailsProps) {
    const itemSprite = getItemSpritePath(item.name)
    const isForageable = item.forageable ?? false
    const hasTiller = professions.includes("tiller")
    const hasBearsKnowledge = professions.includes("bearsKnowledge")

    // Track whether item was foraged or grown
    const [wasForaged, setWasForaged] = useState<boolean>(true)
    const [selectedQuality, setSelectedQuality] = useState<string>("normal")

    // Determine which price category to use based on source and professions
    let category: string
    if (wasForaged && hasBearsKnowledge && hasTiller) {
        category = "bearsKnowledgeTiller"
    } else if (wasForaged && hasBearsKnowledge) {
        category = "bearsKnowledge"
    } else if (hasTiller) {
        category = "tiller"
    } else {
        category = "base"
    }

    const categories = [category]
    const qualities = item.prices[category as keyof typeof item.prices]

    // Derive the selected price from current item and quality (no separate state needed)
    const selectedPrice = qualities?.[selectedQuality as keyof typeof qualities] || qualities?.normal || 0

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
                <h3 className="text-md italic text-gray-500">{item.description}</h3>
            </div>

            {isForageable && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Source:</span>
                    <ToggleGroup variant="outline" type="single" value={wasForaged ? "foraged" : "grown"} onValueChange={(value) => {
                        if (value) setWasForaged(value === "foraged")
                    }}>
                        <ToggleGroupItem value="foraged" aria-label="Foraged">
                            Foraged
                        </ToggleGroupItem>
                        <ToggleGroupItem value="grown" aria-label="Grown">
                            Grown
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            )}

            {categories.map(category => {
                const qualities = item.prices[category as keyof typeof item.prices]
                if (!qualities) return null

                return (
                    <div key={category}>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(qualities).map(([quality, price]) => {
                                const isSelected = selectedQuality === quality
                                return (
                                    <Item
                                        key={quality}
                                        variant="muted"
                                        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-400'}`}
                                        onClick={() => {
                                            setSelectedQuality(quality)
                                        }}
                                    >
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
                                            <ItemDescription className="text-sm !line-clamp-none">
                                                <span className="block font-bold">{price}g</span>
                                                {item.daysToMature && (
                                                    <span className="block text-xs text-gray-500">
                                                        first harvest: {(price / item.daysToMature).toFixed(1)}g/day
                                                    </span>
                                                )}
                                                {item.daysToRegrow && (
                                                    <span className="block text-xs text-gray-500">
                                                        then: {(price / item.daysToRegrow).toFixed(1)}g/day
                                                    </span>
                                                )}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )
                            })}
                        </div>
                    </div>
                )
            })}

            <DerivedItems
                baseItem={item}
                professions={professions}
                selectedBasePrice={selectedPrice}
            />
        </div>
    )
}
