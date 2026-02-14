export const processorConfig = {
    "Keg": {
        processingDays: {
            fruit: 6.25,
            vegetable: 4,
        },
    },
    "Preserves Jar": {
        processingDays: 2.5,
    },
    "Dehydrator": {
        processingDays: 1,
    },
    "Mill": {
        processingDays: 1,
    },
} as const

export type ProcessorName = keyof typeof processorConfig
