import { Int, Float } from './bytes.ts'

interface StagePart {
    external_identifier: number,
    flags: number,

    // References a lookup table that describes how a gear dye is applied
    gear_dye_change_color_index: number,

    // The size of the part index buffer (relative to start_indeX)
    index_count: number,
    index_max: number,
    index_min: number,
    lod_category: {
        value: number,
        name: string
    },
    lod_run: number,

    // 3=triangles, 5=triangle strip
    primitive_type: number,

    // Information about the shader used for this part
    shader: {
        // Common static textures that are shared across all models
        static_textures?: string[]
        type: number
    },

    // The offset into the index buffer where this part starts
    start_index: 1,
    variant_shader_index: -1
}

interface SimpleBufferInfo {
    file_name: string,
    byte_size: number,
    value_byte_size?: number
    stride_byte_size?: number
}

interface StagePartVertexLayoutFormat {
    stride: number
    elements: {
        normalized: boolean,
        offset: number,
        semantic: string,
        semantic_index: number,
        size: number,
        type: string
    }[]
}

interface StagePartVertexLayout {
    formats: StagePartVertexLayoutFormat[],
    type: string
}

interface RenderMeshes {
    shader_tags: string[],

    bounding_volume: {
        max_x: number,
        max_y: number,
        max_z: number,
        min_x: number,
        min_y: number,
        min_z: number
    },

    position_offset: number[],
    position_scale: number[],

    stage_part_list: StagePart[],
    stage_part_offsets: number[],
    stage_part_vertex_stream_layout_definitions: StagePartVertexLayout[],
    stage_part_vertex_stream_layout_lookup: number[],

    texcoord0_scale_offset: number[],
    texcoord_offset: number[],
    texcoord_scale: number[],

    vertex_buffers: SimpleBufferInfo[],
    index_buffer: SimpleBufferInfo,
    data_driven_vertex_buffer: SimpleBufferInfo,
    single_pass_skin_vertex_bufer: SimpleBufferInfo
}

interface RenderModel {
    render_meshes: RenderMeshes[]
}

export interface RenderMetadata {
    render_model: RenderModel
    texture_plates: {
        gear_decal_dye_index: number,
        number_of_plateable_gear_slots: number,
        number_of_gear_slots: number,
        plate_set: Object,
        gear_slot_requires_plating: boolean
    }[]
}

// Helper functions

export interface ParsedFormatEntry {
    name: string
    count: number,
    type: Int | Float,
    normalize: boolean
}

export interface ParsedFormat {
    [key: string]: ParsedFormatEntry[]
}

// Function to extract the instructions on how to read each buffer
export function GetBufferReadInfo(rm: RenderMetadata)
{
    const mesh = rm.render_model.render_meshes[0]

    const last = (a: any[]) => a[a.length - 1]

    // Simple conversion from number of bytes to integer type
    const sizeToIntType = (size: number) => {
        switch(size) {
            case 1: return Int.U8
            case 2: return Int.U16
            case 4: return Int.U32
            default: return Float.F64
        }
    }

    // Converts a string to a data type
    const nameToDataType = (name: string): Int | Float => {
        switch(name) {
            case 'ubyte': return Int.U8
            case 'byte': return Int.S8
            case 'ushort': return Int.U16
            case 'short': return Int.S16
            case 'uint': return Int.U32
            case 'int': return Int.S32
            case 'float': return Float.F32
            default: return Float.F64
        }
    }

    let formats: ParsedFormat = {}

    // Loads everything except the vertex buffers
    Object.entries(mesh).map(([key, value]) => {
        if(value['file_name']) {

            if(!value['value_byte_size']) {
                // Non-trivial format
                formats[value['file_name']] = [{
                    name: 'none',
                    count: 0,
                    type: Float.F64,
                    normalize: false
                }]
                return
            }

            // Trivial format
            formats[value['file_name']] = [{
                    name: key, // index_buffer, etc.
                    count: 1,
                    type: sizeToIntType(value['value_byte_size']),
                    normalize: false
            }]
        }
    })

    // Get the vertex buffer names sorted by stride size
    const sortedVertexFormatPrimitives = mesh.vertex_buffers.sort((a, b) => a.stride_byte_size! - b.stride_byte_size!)

    // All elements of the formats array are duplicates of the first
    const vertexFormats = mesh.stage_part_vertex_stream_layout_definitions[0].formats
    // Sort by ascending stride size
    const sortedVertexFormats = vertexFormats.sort((a, b) => a.stride - b.stride)
    sortedVertexFormats.forEach((val, i) => {
        const parsedFormats: ParsedFormatEntry[] = []

        // Loop through the elements of the format
        val.elements.forEach((element) => {

            const dataLayoutInfo = last(element.type.split('_')) as string
            const elementName = last(element.semantic.split('_')) as string

            parsedFormats.push({
                name: elementName,
                count: parseInt(dataLayoutInfo.slice(-1)),
                type: nameToDataType(dataLayoutInfo.slice(0, -1)),
                normalize: element.normalized
            })
        })

        formats[sortedVertexFormatPrimitives[i].file_name] = parsedFormats
        
    })

    return formats
}