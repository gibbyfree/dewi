"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ProfessionsProps {
    professions: string[]
    onChange: (professions: string[]) => void
}

export function ProfessionToggles({
    professions,
    onChange,
}: ProfessionsProps) {
    return (
        <ToggleGroup type="multiple" value={professions} onValueChange={onChange} spacing={2} variant="outline" className="mt-4 mb-4">
            <ToggleGroupItem value="tiller">
                Tiller
            </ToggleGroupItem>
            <ToggleGroupItem value="artisan">
                Artisan
            </ToggleGroupItem>
            <ToggleGroupItem value="rancher">
                Rancher
            </ToggleGroupItem>
        </ToggleGroup>
    )
}
