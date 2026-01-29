"use client"

import { useState } from "react"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"

const ITEMS = ["Apple", "Apricot", "Blueberry"]

export default function Home() {
  const [query, setQuery] = useState("")

  const hasInput = query.trim() !== ""

  const results = ITEMS.filter(item =>
    hasInput && item.toLowerCase().includes(query.toLowerCase())
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
            <CommandItem key={item}>
              {item}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </main>
  )
}