"use client"

import { useState, useRef } from "react"
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
import itemsData from "@/data/items.json"
import { buildItemIndex } from "@/lib/recipeGraph"
import { getEffectivePrices, getPriceCategory, getSourceItemName, formatBuffs } from "@/lib/prices"

const items = itemsData.items as GameItem[]
const itemsByName = buildItemIndex(items)

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
        const fileName = item.name.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-")
        const subfolder = item.category === "animal-product" ? "animals"
            : item.category === "fish" ? "fish"
            : "crops"
        return `/sprites/bases/${subfolder}/${fileName}.png`
    }

    // Derived items: infer color from source base item
    const color = item.color ?? getSourceColor(item.name)
    if (color) {
        for (const [pattern, suffix] of DERIVED_SPRITE_SUFFIXES) {
            if (pattern.test(item.name)) {
                return `/sprites/processedes/${color}/${color}-${suffix}.png`
            }
        }
    }

    return null
}

function getSourceColor(derivedName: string): string | undefined {
    const source = getSourceItemName(derivedName)
    if (!source) return undefined
    return itemsByName.get(source.sourceName)?.color ?? undefined
}

// getPriceCategory is now imported from @/lib/prices

interface ItemDetailsProps {
    item: GameItem
    professions: string[]
    wasForaged: boolean
    onWasForagedChange: (wasForaged: boolean) => void
    onNavigateToItem?: (item: GameItem) => void
}

export function ItemDetails({ item, professions, wasForaged, onWasForagedChange, onNavigateToItem }: ItemDetailsProps) {
    // selectedQuality lives here so it survives profession/foraged toggles.
    // Only reset to "normal" when the item itself changes.
    const [selectedQuality, setSelectedQuality] = useState<string>("normal")
    const prevItemRef = useRef(item.name)
    if (prevItemRef.current !== item.name) {
        prevItemRef.current = item.name
        setSelectedQuality("normal")
    }
    return <ItemDetailsInner key={`${item.name}-${wasForaged}`} item={item} professions={professions} wasForaged={wasForaged} onWasForagedChange={onWasForagedChange} onNavigateToItem={onNavigateToItem} selectedQuality={selectedQuality} onQualityChange={setSelectedQuality} />
}

interface ItemDetailsInnerProps extends ItemDetailsProps {
    selectedQuality: string
    onQualityChange: (q: string) => void
}

function ItemDetailsInner({ item, professions, wasForaged, onWasForagedChange, onNavigateToItem, selectedQuality, onQualityChange }: ItemDetailsInnerProps) {
    const itemSprite = getItemSpritePath(item)
    const isForageable = item.forageable ?? false

    // Determine which price category to use
    const category = getPriceCategory(item.name, item.category, isForageable, wasForaged, professions)

    // Use stored prices or compute from formula
    const effectivePrices = getEffectivePrices(item, itemsByName)

    // Fallback to base if the desired category doesn't exist
    let qualities = effectivePrices?.[category as keyof typeof effectivePrices]
    if (!qualities) {
        qualities = effectivePrices?.base
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
                const qualities = effectivePrices?.[category as keyof typeof effectivePrices] ?? effectivePrices?.base
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
                                            onQualityChange(quality)
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

            {item.category === "cooked" && item.energy !== undefined && (
                <div className="text-sm text-gray-600 space-y-0.5">
                    <div>⚡ {item.energy} &nbsp;❤️ {item.health}</div>
                    {item.buffs && item.buffs.length > 0 && (
                        <div className="text-xs text-indigo-600">{formatBuffs(item.buffs)}</div>
                    )}
                </div>
            )}

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

