interface IndexSet {
    textures: number[], 
    geometry: number[]
}

interface GeometryContent {
    platform: string,
    geometry: string[],
    textures: string[],
    dye_index_set: IndexSet,
    region_index_sets: { [key: string]: IndexSet }
}

export interface GeometryBody {
    gear: string[]
    content: GeometryContent[]
}