"use client"

import { useState } from "react"
import { ItemSearch, type Item } from "@/components/ItemSearch"
import { ItemDetails } from "@/components/ItemDetails"

export default function Home() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  return (
    <main className="max-w-md mx-auto mt-10 p-4">
      <ItemSearch
        query={query}
        onQueryChange={setQuery}
        selected={selected}
        onSelectedChange={setSelected}
        onSelectItem={setSelectedItem}
      />
      <ItemDetails item={selectedItem} />
    </main>
  )
}