"use client"

import { useState } from "react"
import { ItemSearch } from "@/components/ItemSearch"
import { ItemDetails } from "@/components/ItemDetails"
import { ProfessionToggles } from "@/components/ProfessionToggles"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { useItemNavigation } from "@/lib/useItemNavigation"

export default function Home() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState("")
  const [professions, setProfessions] = useLocalStorage<string[]>("professions", [])
  const [wasForaged, setWasForaged] = useState<boolean>(true)
  const { currentItem, history, navigateTo, goBack, canGoBack } = useItemNavigation()

  return (
    <main className="max-w-md mx-auto mt-10 p-4">
      <ItemSearch
        query={query}
        onQueryChange={setQuery}
        selected={selected}
        onSelectedChange={setSelected}
        onSelectItem={navigateTo}
      />
      <ProfessionToggles professions={professions} onChange={setProfessions} />
      {canGoBack && (
        <button
          onClick={goBack}
          className="text-sm text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1"
        >
          ← Back to {history[history.length - 1].name}
        </button>
      )}
      {currentItem && (
        <ItemDetails
          item={currentItem}
          professions={professions}
          wasForaged={wasForaged}
          onWasForagedChange={setWasForaged}
          onNavigateToItem={navigateTo}
        />
      )}
    </main>
  )
}