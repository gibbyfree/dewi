"use client"

import { useState } from "react"
import Image from "next/image"
import type { GameItem } from "@/types/items"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DerivedItems } from "./DerivedItems"

const qualitySprites: Record<string, string> = {
    silver: "/sprites/silver.webp",
    gold: "/sprites/gold.webp",
    iridium: "/sprites/iridium.webp",
}

// Convert item name to sprite filename
// Map item name patterns to processed sprite type suffixes
const DERIVED_SPRITE_SUFFIXES: [RegExp, string][] = [
    [/ Wine$/, "wine"],
    [/ Jelly$/, "jelly"],
    [/ Juice$/, "juice"],
    [/^Pickled /, "pickles"],
    [/^Dried /, "dried-fruit"],
]

function getItemSpritePath(item: GameItem): string | null {
    if (item.spritePath) return item.spritePath

    if (item.base) {
        const fileName = item.name.toLowerCase().replace(/\s+/g, "-")
        const subfolder = item.category === "animal-product" ? "animals" : "crops"
        return `/sprites/bases/${subfolder}/${fileName}.png`
    }

    // Derived items with a color: resolve from color + name pattern
    if (item.color) {
        for (const [pattern, suffix] of DERIVED_SPRITE_SUFFIXES) {
            if (pattern.test(item.name)) {
                return `/sprites/processedes/${item.color}/${item.color}-${suffix}.png`
            }
        }
    }

    return null
}

// Determine price category based on item, professions, and source
function getPriceCategory(
    itemName: string,
    category: GameItem["category"],
    isForageable: boolean,
    wasForaged: boolean,
    professions: string[]
): "base" | "tiller" | "bearsKnowledge" | "bearsKnowledgeTiller" | "artisan" | "rancher" | "angler" {
    const hasTiller = professions.includes("tiller")
    const hasArtisan = professions.includes("artisan")
    const hasBearsKnowledge = professions.includes("bearsKnowledge")
    const hasRancher = professions.includes("rancher")
    const hasAngler = professions.includes("angler")

    const isBerry = itemName === "Blackberry" || itemName === "Salmonberry"

    // Fish use angler
    if (category === "fish" && hasAngler) return "angler"

    // Animal products use rancher
    if (category === "animal-product" && hasRancher) return "rancher"

    // Artisan goods use artisan
    if ((category === "artisan-good" || category === "processed") && hasArtisan) return "artisan"

    // Bear's knowledge for berries
    const bearsApplies = isBerry && wasForaged && hasBearsKnowledge
    const tillerApplies = hasTiller && (!isForageable || isBerry || !wasForaged)

    if (bearsApplies) return tillerApplies ? "bearsKnowledgeTiller" : "bearsKnowledge"
    if (tillerApplies && (category === "crop" || category === "fruit")) return "tiller"

    return "base"
}

interface ItemDetailsProps {
    item: GameItem
    professions: string[]
    wasForaged: boolean
    onWasForagedChange: (wasForaged: boolean) => void
    onNavigateToItem?: (item: GameItem) => void
}

export function ItemDetails({ item, professions, wasForaged, onWasForagedChange, onNavigateToItem }: ItemDetailsProps) {
    return <ItemDetailsInner key={`${item.name}-${professions.join('-')}-${wasForaged}`} item={item} professions={professions} wasForaged={wasForaged} onWasForagedChange={onWasForagedChange} onNavigateToItem={onNavigateToItem} />
}

function ItemDetailsInner({ item, professions, wasForaged, onWasForagedChange, onNavigateToItem }: ItemDetailsProps) {
    const itemSprite = getItemSpritePath(item)
    const isForageable = item.forageable ?? false

    const [selectedQuality, setSelectedQuality] = useState<string>("normal")

    // Determine which price category to use
    const category = getPriceCategory(item.name, item.category, isForageable, wasForaged, professions)

    // Fallback to base if the desired category doesn't exist
    let qualities = item.prices[category as keyof typeof item.prices]
    if (!qualities) {
        qualities = item.prices.base
    }

    const categories = [category]

    // Derive the selected price from current item and quality (no separate state needed)
    const selectedPrice = qualities?.[selectedQuality as keyof typeof qualities] || qualities?.normal || 0

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
                {itemSprite && (
                    <Image
                        src={itemSprite}
                        alt={item.name}
                        width={64}
                        height={64}
                    />
                )}
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <h3 className="text-md italic text-gray-500">{item.description}</h3>
            </div>

            {isForageable && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Source:</span>
                    <ToggleGroup
                        type="single"
                        value={wasForaged ? "foraged" : "grown"}
                        onValueChange={(value) => {
                            if (value) onWasForagedChange(value === "foraged")
                        }}
                        variant="outline"
                    >
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
                                                    {itemSprite && (
                                                        <Image
                                                            src={itemSprite}
                                                            alt={item.name}
                                                            width={64}
                                                            height={64}
                                                        />
                                                    )}
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
                                                        {item.daysToRegrow ? 'first harvest: ' : ''}{(price / item.daysToMature).toFixed(1)}g/day
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
                selectedQuality={selectedQuality}
                onNavigateToItem={onNavigateToItem}
            />
        </div>
    )
}

