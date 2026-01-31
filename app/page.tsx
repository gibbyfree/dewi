"use client"

import { useState } from "react"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"
import itemsData from "@/data/items.json"

interface PriceQualities {
  normal: number
  silver?: number
  gold?: number
  iridium?: number
}

interface Item {
  name: string
  prices: {
    base: PriceQualities
    tiller?: PriceQualities
    artisan?: PriceQualities
  }
  sprite: string
}

const items: Item[] = itemsData.items

function formatPrices(prices: Item["prices"]): string {
  const parts: string[] = []

  for (const [category, qualities] of Object.entries(prices)) {
    const qualityParts: string[] = []
    for (const [quality, price] of Object.entries(qualities)) {
      qualityParts.push(`${quality}: ${price}g`)
    }
    parts.push(`${category} (${qualityParts.join(", ")})`)
  }

  return parts.join(" | ")
}

export default function Home() {
  const [query, setQuery] = useState("")

  const hasInput = query.trim() !== ""

  const results = items.filter(item =>
    hasInput && item.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <main className="max-w-md mx-auto mt-10 p-4">
      <Command>
        <CommandInput
          placeholder="Search items…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {results.length === 0 && hasInput && (
            <CommandEmpty>No results.</CommandEmpty>
          )}
          {results.map(item => (
            <CommandItem key={item.name} className="flex flex-col items-start gap-1">
              <span className="font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                {formatPrices(item.prices)}
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </main>
  )
}