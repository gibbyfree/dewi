"use client"

import {
    Command,
    CommandInput,
    CommandItem,
    CommandList,
    CommandEmpty,
    CommandGroup,
} from "@/components/ui/command"
import itemsData from "@/data/items.json"
import type { GameItem, ItemCategory } from "@/types/items"

const items = itemsData.items as GameItem[]

const categoryLabels: Record<ItemCategory, string> = {
    crop: "Crops",
    fruit: "Fruit",
    "animal-product": "Animal Products",
    fish: "Fish",
    "artisan-good": "Artisan Goods",
    processed: "Processed Items",
}

// Display order for categories
const categoryOrder: ItemCategory[] = [
    "crop", "fruit", "animal-product", "fish", "artisan-good", "processed",
]

interface ItemSearchProps {
    query: string
    onQueryChange: (query: string) => void
    selected: string
    onSelectedChange: (selected: string) => void
    onSelectItem: (item: GameItem) => void
}

export function ItemSearch({
    query,
    onQueryChange,
    selected,
    onSelectedChange,
    onSelectItem,
}: ItemSearchProps) {
    const hasInput = query.trim() !== ""

    const results = !hasInput ? [] : (() => {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean)
        return items
            .filter(item =>
                item.base && words.every(w => item.name.toLowerCase().includes(w))
            )
            .sort((a, b) => {
                const al = a.name.toLowerCase(), bl = b.name.toLowerCase(), ql = query.toLowerCase()
                // Exact prefix first, then alphabetical
                const aPrefix = al.startsWith(ql) ? 0 : 1
                const bPrefix = bl.startsWith(ql) ? 0 : 1
                return aPrefix - bPrefix || al.localeCompare(bl)
            })
    })()

    // Group results by category
    const grouped = results.reduce<Partial<Record<ItemCategory, GameItem[]>>>((acc, item) => {
        const cat = item.category
        if (!acc[cat]) acc[cat] = []
        acc[cat]!.push(item)
        return acc
    }, {})

    return (
        <Command value={selected} onValueChange={onSelectedChange}>
            <CommandInput
                placeholder="Search items…"
                value={query}
                onValueChange={onQueryChange}
            />
            <CommandList>
                {results.length === 0 && hasInput && (
                    <CommandEmpty>No results.</CommandEmpty>
                )}
                {categoryOrder
                    .filter(cat => grouped[cat]?.length)
                    .map(cat => (
                        <CommandGroup key={cat} heading={categoryLabels[cat]}>
                            {grouped[cat]!.map(item => (
                                <CommandItem
                                    key={item.name}
                                    value={item.name}
                                    onSelect={() => {
                                        onSelectItem(item)
                                        onQueryChange("")
                                    }}
                                    className="flex flex-col items-start gap-1"
                                >
                                    <span className="font-medium">{item.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ))
                }
            </CommandList>
        </Command>
    )
}
