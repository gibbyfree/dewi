"use client"

import { useState } from "react"
import { ItemSearch, type GameItem } from "@/components/ItemSearch"
import { ItemDetails } from "@/components/ItemDetails"
import { ProfessionToggles } from "@/components/ProfessionToggles"
import { useLocalStorage } from "@/lib/useLocalStorage"

export default function Home() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState("")
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [professions, setProfessions] = useLocalStorage<string[]>("professions", [])

  return (
    <main className="max-w-md mx-auto mt-10 p-4">
      <ItemSearch
        query={query}
        onQueryChange={setQuery}
        selected={selected}
        onSelectedChange={setSelected}
        onSelectItem={setSelectedItem}
      />
      <ProfessionToggles professions={professions} onChange={setProfessions} />
      <ItemDetails item={selectedItem} professions={professions} />
    </main>
  )
}