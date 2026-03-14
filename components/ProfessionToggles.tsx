"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ProfessionsProps {
    professions: string[]
    onChange: (professions: string[]) => void
}

export function ProfessionToggles({ professions, onChange }: ProfessionsProps) {
    const farmingSkill = professions.includes("tiller") ? "tiller"
        : professions.includes("rancher") ? "rancher" : ""

    const fishingSkill = professions.includes("angler") ? "angler"
        : professions.includes("fisher") ? "fisher" : ""

    const otherProfessions = professions.filter(
        p => p !== "tiller" && p !== "rancher" && p !== "fisher" && p !== "angler"
    )

    const handleFarmingChange = (value: string) => {
        const rest = professions.filter(p => p !== "tiller" && p !== "rancher")
        onChange(value ? [...rest, value] : rest)
    }

    const handleFishingChange = (value: string) => {
        const rest = professions.filter(p => p !== "fisher" && p !== "angler")
        onChange(value ? [...rest, value] : rest)
    }

    const handleOtherChange = (values: string[]) => {
        const farming = professions.filter(p => p === "tiller" || p === "rancher")
        const fishing = professions.filter(p => p === "fisher" || p === "angler")
        onChange([...farming, ...fishing, ...values])
    }

    return (
        <div className="mt-4 mb-4 flex flex-wrap gap-2">
            <ToggleGroup type="single" value={farmingSkill} onValueChange={handleFarmingChange} spacing={0} variant="outline">
                <ToggleGroupItem value="tiller">Tiller</ToggleGroupItem>
                <ToggleGroupItem value="rancher">Rancher</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" value={fishingSkill} onValueChange={handleFishingChange} spacing={0} variant="outline">
                <ToggleGroupItem value="fisher">Fisher</ToggleGroupItem>
                <ToggleGroupItem value="angler">Angler</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" value={otherProfessions} onValueChange={handleOtherChange} spacing={2} variant="outline">
                <ToggleGroupItem value="artisan">Artisan</ToggleGroupItem>
                <ToggleGroupItem value="bearsKnowledge">Bear&apos;s Knowledge</ToggleGroupItem>
            </ToggleGroup>
        </div>
    )
}
