// Processor configuration
// Note: Processing times are specified per-recipe in recipes.json since they vary by input
export const processorConfig = {
    "Keg": {},
    "Preserves Jar": {},
    "Dehydrator": {},
    "Mill": {},
    "Oil Maker": {},
    "Mayonnaise Machine": {},
    "Cheese Press": {},
    "Cask": {},
    "Fish Smoker": {},
    "Fish Pond": {},
} as const

export type ProcessorName = keyof typeof processorConfig
