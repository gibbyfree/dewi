"use client"

import {
    Command,
    CommandInput,
    CommandItem,
    CommandList,
    CommandEmpty,
} from "@/components/ui/command"
import itemsData from "@/data/items.json"
import type { GameItem } from "@/types/items"

const items: GameItem[] = itemsData.items

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

    const results = items.filter(item =>
        hasInput && item.name.toLowerCase().startsWith(query.toLowerCase()) && item.base
    )

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
                {results.map(item => (
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
            </CommandList>
        </Command>
    )
}
