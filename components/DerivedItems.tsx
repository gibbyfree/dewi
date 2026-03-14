"use client"

import { Fragment, useState, useRef } from "react"
import Image from "next/image"
import { Popover as PopoverPrimitive } from "radix-ui"
import type { GameItem, Recipe, RecipeIngredient } from "@/types/items"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import recipesData from "@/data/recipes.json"
import itemsData from "@/data/items.json"
import { getProductsForItem, buildItemIndex, buildAliasMap } from "@/lib/recipeGraph"
import { resolveFormula, getEffectivePrices, getPriceCategory, getSourceItemName, formatBuffs } from "@/lib/prices"
import { getCaskAgingDays } from "@/config/processors"

const recipesTyped = recipesData as unknown as { aliases: string[][]; recipes: Recipe[] }
const recipes = recipesTyped.recipes
const aliasMap = buildAliasMap(recipesTyped.aliases ?? [])
const items = itemsData.items as GameItem[]
const itemsByName = buildItemIndex(items)

const qualitySprites: Record<string, string> = {
    silver: "/sprites/silver.webp",
    gold: "/sprites/gold.webp",
    iridium: "/sprites/iridium.webp",
}

// Map product names to price formula names
const PRICE_FORMULA_PATTERNS: [RegExp, string][] = [
    [/ Wine$/, "wine"],
    [/ Jelly$/, "jelly"],
    [/ Juice$/, "juice"],
    [/^Pickled /, "pickles"],
    [/^Dried /, "dried"],
]

function getProductFormula(productName: string): string | null {
    for (const [pattern, formula] of PRICE_FORMULA_PATTERNS) {
        if (pattern.test(productName)) return formula
    }
    return null
}

// Formulas where price depends on the selected quality price, not the base normal price
const QUALITY_SENSITIVE_FORMULAS = new Set(["smoked_fish"])

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

/**
 * Compute the total sell value of all ingredients in a recipe.
 * The viewed item uses its quality+profession-adjusted price; other ingredients use normal quality
 * with profession adjustments.
 */
function computeIngredientsCost(
    ingredients: RecipeIngredient[],
    viewedItem: GameItem,
    viewedItemPrice: number,
    professions: string[]
): number {
    let total = 0
    for (const ing of ingredients) {
        if (ing.name === viewedItem.name) {
            total += viewedItemPrice * ing.quantity
        } else {
            const item = itemsByName.get(ing.name)
            if (item?.prices) {
                const cat = getPriceCategory(item.name, item.category, item.forageable ?? false, false, professions)
                const prices = item.prices[cat as keyof typeof item.prices] ?? item.prices.base
                total += (prices?.normal ?? 0) * ing.quantity
            }
        }
    }
    return total
}

// Look up the effective sell price for any ingredient at normal quality
function getIngredientPrice(ingredientName: string, professions: string[]): number {
    const item = itemsByName.get(ingredientName)
    if (!item?.prices) return 0
    const cat = getPriceCategory(item.name, item.category, item.forageable ?? false, false, professions)
    const prices = getEffectivePrices(item, itemsByName)
    return prices?.[cat as keyof typeof prices]?.normal ?? prices?.base?.normal ?? 0
}

// Wraps an ingredient sprite with a popover showing name + price on hover (desktop) or tap (mobile)
function IngredientPopover({
    children,
    ingredientName,
    ingredientPrice,
}: {
    children: React.ReactNode
    ingredientName: string
    ingredientPrice: number
}) {
    const [open, setOpen] = useState(false)
    const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

    const handlePointerEnter = (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return
        clearTimeout(closeTimer.current)
        setOpen(true)
    }
    const handlePointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return
        closeTimer.current = setTimeout(() => setOpen(false), 150)
    }

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <div onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
                    {children}
                </div>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    side="top"
                    sideOffset={4}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    <p className="font-medium">{ingredientName}</p>
                    {ingredientPrice > 0 && <p className="text-muted-foreground">{ingredientPrice}g</p>}
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    )
}

// Get sprite path for an ingredient item
function getIngredientSpritePath(ingredientName: string): string | null {
    const item = itemsByName.get(ingredientName)
    if (!item) return null
    if (item.spritePath) return item.spritePath
    if (item.base) {
        const fileName = item.name.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-")
        const subfolder = item.category === "animal-product" ? "animals"
            : item.category === "fish" ? "fish"
            : "crops"
        return `/sprites/bases/${subfolder}/${fileName}.png`
    }
    return null
}

interface DerivedItemsProps {
    baseItem: GameItem
    professions: string[]
    selectedBasePrice: number
    selectedQuality: string
    onNavigateToItem?: (item: GameItem) => void
}

export function DerivedItems({ baseItem, professions, selectedBasePrice, selectedQuality, onNavigateToItem }: DerivedItemsProps) {
    // Sort so Kitchen recipes (cooking) always appear last
    const resolvedProducts = getProductsForItem(baseItem, recipes, aliasMap)
        .sort((a, b) => {
            const aKitchen = a.product.processor === "Kitchen" ? 1 : 0
            const bKitchen = b.product.processor === "Kitchen" ? 1 : 0
            return aKitchen - bKitchen
        })

    // Also check if this item itself is cask-eligible (e.g. when navigating to a wine)
    const caskAging = getCaskAgingDays(baseItem.name)
    const hasCaskAging = !!caskAging
    const hasRecipeProducts = resolvedProducts.length > 0

    if (!hasRecipeProducts && !hasCaskAging) return null

    return (
        <div className="mt-6">
            <div className="space-y-4">
                {resolvedProducts.map(({ product, resolvedName, resolvedSprite }) => {
                    const derivedItem = itemsByName.get(resolvedName) ?? null
                    // Resolve {input} template and alias substitution in ingredient names.
                    // If an ingredient is an alias of the viewed item (e.g. "Egg" when viewing "Large Egg"),
                    // substitute the viewed item's name so sprites and costs are correct.
                    const itemCanonical = aliasMap.get(baseItem.name) ?? baseItem.name
                    const resolvedIngredients = product.ingredients.map(i => {
                        let name = i.name === "{input}" ? baseItem.name : i.name
                        if (name !== baseItem.name && (aliasMap.get(name) ?? name) === itemCanonical) {
                            name = baseItem.name
                        }
                        return { ...i, name }
                    })
                    const viewedIngredient = resolvedIngredients.find(i => i.name === baseItem.name)
                    const inputQuantity = viewedIngredient?.quantity || resolvedIngredients[0]?.quantity || 1
                    const outputQuantity = product.outputQuantity || 1
                    const processingDays = product.processingDays
                    const isKitchenRecipe = product.processor === "Kitchen"
                    // Extra ingredients are those beyond the base item being viewed
                    const extraIngredients = resolvedIngredients.filter(i => i.name !== baseItem.name)
                    // Kitchen: show all ingredient sprites. Other multi-ingredient processors: show processor + extras.
                    const showIngredientSprites = isKitchenRecipe
                    const showProcessorWithExtras = !isKitchenRecipe && extraIngredients.length > 0

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

                    // Compute price from formula if available, otherwise use stored prices
                    let price = 0
                    const formulaName = product.priceFormula ?? getProductFormula(resolvedName)
                    if (formulaName && baseItem.prices?.base) {
                        // Quality-sensitive formulas (smoked_fish) use the profession+quality-adjusted price,
                        // i.e. whatever you'd sell the fish for (selectedBasePrice).
                        // Other formulas (wine, jelly, juice, pickles, dried) use the base normal price.
                        const inputPrice = QUALITY_SENSITIVE_FORMULAS.has(formulaName)
                            ? selectedBasePrice
                            : baseItem.prices.base.normal
                        price = resolveFormula(formulaName, inputPrice) ?? 0
                        if (professions.includes("artisan")) {
                            price = Math.floor(price * 1.4)
                        }
                    } else if (derivedItem?.prices) {
                        const effectivePrices = getEffectivePrices(derivedItem, itemsByName)
                        const derivedCat = getPriceCategory(derivedItem.name, derivedItem.category, false, false, professions)
                        const prices = effectivePrices?.[derivedCat as keyof typeof effectivePrices] ?? effectivePrices?.base
                        price = prices?.normal || 0
                    }

                    // Calculate delta: total output value minus total ingredient cost
                    // Ingredient cost uses selectedBasePrice (profession-adjusted) as the opportunity cost
                    const totalBaseCost = computeIngredientsCost(resolvedIngredients, baseItem, selectedBasePrice, professions)
                    const totalOutputValue = price * outputQuantity
                    const delta = totalBaseCost > 0 ? totalOutputValue - totalBaseCost : 0
                    const deltaText = delta > 0 ? `+${delta}g` : delta < 0 ? `${delta}g` : "0g"

                    const deltaColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600"

                    const displayName = resolvedName || product.name
                    const isClickable = !!derivedItem && !!onNavigateToItem

                    // For Kitchen recipes, show viewed item first then extras
                    const orderedIngredients = showIngredientSprites
                        ? [
                            ...resolvedIngredients.filter(i => i.name === baseItem.name),
                            ...resolvedIngredients.filter(i => i.name !== baseItem.name),
                        ]
                        : []

                    const processorIcon = (
                        <div className="relative group w-12 h-12">
                            <Image
                                src={getProcessorSpritePath(product.processor)}
                                alt={product.processor}
                                width={48}
                                height={48}
                                className={product.processor === "Fish Smoker" ? "group-hover:opacity-0" : ""}
                            />
                            {product.processor === "Fish Smoker" && (
                                <Image
                                    src="/sprites/processors/fish-smoker-glow.png"
                                    alt={product.processor}
                                    width={48}
                                    height={48}
                                    className="absolute top-0 left-0 opacity-0 group-hover:opacity-100"
                                />
                            )}
                            {!showProcessorWithExtras && inputQuantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {inputQuantity}
                                </div>
                            )}
                        </div>
                    )

                    return (
                        <div key={`${resolvedName}-${product.processor}`} className="flex items-center gap-3">
                            {showIngredientSprites ? (
                                // Kitchen recipe: show all ingredient sprites
                                <div className="flex items-center gap-1">
                                    {orderedIngredients.map((ing, idx) => {
                                        const spritePath = getIngredientSpritePath(ing.name)
                                        const ingPrice = ing.name === baseItem.name
                                            ? selectedBasePrice
                                            : getIngredientPrice(ing.name, professions)
                                        return (
                                            <Fragment key={ing.name}>
                                                {idx > 0 && <span className="text-lg text-gray-400">+</span>}
                                                <IngredientPopover ingredientName={ing.name} ingredientPrice={ingPrice}>
                                                    <div className="relative">
                                                        {spritePath && (
                                                            <Image
                                                                src={spritePath}
                                                                alt={ing.name}
                                                                width={32}
                                                                height={32}
                                                            />
                                                        )}
                                                        {ing.quantity > 1 && (
                                                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                                                {ing.quantity}
                                                            </div>
                                                        )}
                                                    </div>
                                                </IngredientPopover>
                                            </Fragment>
                                        )
                                    })}
                                </div>
                            ) : showProcessorWithExtras ? (
                                // Non-Kitchen processor with extra ingredients (e.g. Fish Smoker + Coal):
                                // show processor icon + extra ingredient sprites
                                <div className="flex items-center gap-1">
                                    {processorIcon}
                                    {extraIngredients.map((ing) => {
                                        const spritePath = getIngredientSpritePath(ing.name)
                                        const ingPrice = getIngredientPrice(ing.name, professions)
                                        return (
                                            <Fragment key={ing.name}>
                                                <span className="text-lg text-gray-400">+</span>
                                                <IngredientPopover ingredientName={ing.name} ingredientPrice={ingPrice}>
                                                    <div className="relative">
                                                        {spritePath && (
                                                            <Image
                                                                src={spritePath}
                                                                alt={ing.name}
                                                                width={32}
                                                                height={32}
                                                            />
                                                        )}
                                                        {ing.quantity > 1 && (
                                                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                                                {ing.quantity}
                                                            </div>
                                                        )}
                                                    </div>
                                                </IngredientPopover>
                                            </Fragment>
                                        )
                                    })}
                                </div>
                            ) : (
                                // Standard processor: just the processor icon
                                processorIcon
                            )}
                            <span className="text-2xl">→</span>
                            <Item
                                variant="muted"
                                className={`flex-1 ${isClickable ? 'cursor-pointer hover:ring-1 hover:ring-primary' : ''}`}
                                onClick={isClickable ? () => onNavigateToItem!(derivedItem!) : undefined}
                            >
                                <ItemContent>
                                    <ItemTitle className="flex items-center gap-2">
                                        <div className="relative w-12 h-12 flex items-center justify-center">
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
                                            {product.outputQuality && product.outputQuality !== "normal" && qualitySprites[product.outputQuality] && (
                                                <Image
                                                    src={qualitySprites[product.outputQuality]}
                                                    alt={product.outputQuality}
                                                    width={48}
                                                    height={48}
                                                    className="absolute -bottom-4 -left-4 z-10"
                                                />
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
                                        {totalBaseCost > 0 && price > 0 && delta !== 0 && (
                                            <span className={`ml-2 text-sm ${deltaColor}`}>
                                                ({deltaText})
                                            </span>
                                        )}
{processingDays !== undefined && processingDays > 0 && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                {processingDays}d
                                            </span>
                                        )}
                                    </ItemDescription>
                                    {isKitchenRecipe && derivedItem && derivedItem.energy !== undefined && (
                                        <div className="text-sm text-gray-600 space-y-0.5">
                                            <div>⚡ {derivedItem.energy} &nbsp;❤️ {derivedItem.health}</div>
                                            {derivedItem.buffs && derivedItem.buffs.length > 0 && (
                                                <div className="text-xs text-indigo-600">{formatBuffs(derivedItem.buffs)}</div>
                                            )}
                                        </div>
                                    )}
                                </ItemContent>
                            </Item>
                        </div>
                    )
                })}

                {/* Cask aging section — shown when the item itself has caskAgingDays */}
                {hasCaskAging && <CaskAgingSection item={baseItem} category={professions.includes("artisan") ? "artisan" : "base"} selectedQuality={selectedQuality} />}
            </div>
        </div>
    )
}

const qualityOrder = ["normal", "silver", "gold", "iridium"] as const

// Map item name patterns to processed sprite type suffixes
const DERIVED_SPRITE_SUFFIXES: [RegExp, string][] = [
    [/ Wine$/, "wine"],
    [/ Jelly$/, "jelly"],
    [/ Juice$/, "juice"],
    [/^Pickled /, "pickles"],
    [/^Dried /, "dried-fruit"],
]

function getSourceColor(derivedName: string): string | undefined {
    const source = getSourceItemName(derivedName)
    if (!source) return undefined
    return itemsByName.get(source.sourceName)?.color ?? undefined
}

function getItemSprite(item: GameItem): string | null {
    if (item.spritePath) return item.spritePath
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

function CaskAgingSection({ item, category, selectedQuality }: { item: GameItem; category: string; selectedQuality: string }) {
    const cask = getCaskAgingDays(item.name)!
    const effectivePrices = getEffectivePrices(item, itemsByName)
    const prices = effectivePrices?.[category as keyof typeof effectivePrices]
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
