"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { GameItem } from "@/types/items"

interface ProfessionsProps {
    professions: string[]
    onChange: (professions: string[]) => void
    wasForaged: boolean
    onWasForagedChange: (wasForaged: boolean) => void
    selectedItem: GameItem | null
}

export function ProfessionToggles({
    professions,
    onChange,
    wasForaged,
    onWasForagedChange,
    selectedItem,
}: ProfessionsProps) {
    const isForageable = selectedItem?.forageable ?? false

    return (
        <div className="space-y-2">
            <ToggleGroup type="multiple" value={professions} onValueChange={onChange} spacing={2} variant="outline" className="mt-4">
                <ToggleGroupItem value="tiller">
                    Tiller
                </ToggleGroupItem>
                <ToggleGroupItem value="artisan">
                    Artisan
                </ToggleGroupItem>
                <ToggleGroupItem value="rancher">
                    Rancher
                </ToggleGroupItem>
                <ToggleGroupItem value="bearsKnowledge">
                    Bear&apos;s Knowledge
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    )
}
