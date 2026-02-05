export const processorConfig = {
    "Keg": {
        processingDays: 6.25,
    },
    "Preserves Jar": {
        processingDays: 2.5,
    },
    "Dehydrator": {
        processingDays: 1,
    },
} as const

export type ProcessorName = keyof typeof processorConfig
