import { GeometryBody } from './geometry_body.ts'
import { RenderMetadata, GetBufferReadInfo, ParsedFormatEntry } from './render_metadata.ts'
import { mobileGearCDN } from '@env'
import * as Bytes from './bytes.ts'

async function parseCompressedTGX(url: string)
{
    // First, request the TGXM
    const buffer = await (await fetch(url)).arrayBuffer()
    // Convert this buffer into a Int8Array, which is now readable
    const data = new Int8Array(buffer)

    // Geometry Data represents set of geometry files (called tgxEntries) that have been combined. There's a header, and then the
    // raw data. The header structure is as follows:
    // char[4] magic, which is 'tgxm'
    // uint32 version, which is unused
    // uint32 fileHeaderOffset, which is the offset from the beginning of the file to the end of the header, deliniating the start of the tgxEntries
    // uint32 fileCount, which is the number of tgxEntries present within this file
    // char[256] identifier, which is the name of the overall packed geometry structure
    // tgxEntry[fileCount], the headers of the entries themselves
    // char[] data, the file data

    // A tgxEntry has the following format:
    // char[256] name, important for knowing which geometries to render
    // uint32 offset, offset of this entry relative to the start of the file
    // uint32 type, which is always 0
    // uint32 size, the size of the entry (in bytes)

    // Given this information, lets parse the data
    const magic = Bytes.ToString(data.slice(0, 4))

    if(magic !== 'TGXM') {
        console.error(`FATAL: File with link ${url} is not a valid TGXM`)
        Deno.exit(0)
    }

    const version = Bytes.ToInt(Bytes.Int.U32, data.slice(4, 8))
    const headerOffset = Bytes.ToInt(Bytes.Int.U32, data.slice(8, 12))
    const fileCount = Bytes.ToInt(Bytes.Int.U32, data.slice(12, 16))
    const identifier = Bytes.ToString(data.slice(16, 256 + 16))

    const allFiles = {} as any

    for(let currentFileNo = 0; currentFileNo < fileCount; ++currentFileNo) {
        const startByte = headerOffset + currentFileNo * 272
        const currentFileName = Bytes.ToString(data.slice(startByte, startByte + 256))
        const fileDataOffset = Bytes.ToInt(Bytes.Int.U32, data.slice(startByte + 256, startByte + 256 + 4))
        const fileType = Bytes.ToInt(Bytes.Int.U32, data.slice(startByte + 256 + 4, startByte + 256 + 8))
        const fileSize = Bytes.ToInt(Bytes.Int.U32, data.slice(startByte + 256 + 8, startByte + 256 + 12))

        let fileData: RenderMetadata | Int8Array = data.slice(fileDataOffset, fileDataOffset + fileSize)

        if(currentFileName.includes('js')) {
            // We have the rendermetadata.js - we can immediately parse this file
            fileData = JSON.parse(Bytes.ToString(fileData)) as RenderMetadata
        }

        allFiles[currentFileName] = fileData as Int8Array
    }

    return {
        identifier: identifier,
        allFiles: allFiles
    }
}

async function parseVertexFileData(data: Int8Array, formats: ParsedFormatEntry[])
{
    if(formats[0].name === 'none')
        return null

    // Maps the format name to the format data
    const parsedFile = {} as { [key: string]: number[] }

    formats.forEach((format) => {
        parsedFile[format.name] = []
    })

    // Loop through every byte. Note - we increment by zero because we expect the below statements
    // to increment based on each of the formats and their elements.
    for(let currentByte = 0; currentByte < data.length; currentByte += 0) {

        // Apply the formats, looping through every single entry.
        formats.forEach((format) => {

            for(let currentElementNo = 0; currentElementNo < format.count; ++currentElementNo) {
                const elementSize = Bytes.GetDataTypeSize(format.type)
                const dataRegion = data.slice(currentByte, currentByte + elementSize)
                if((format.type.at(0) === 'F')) {
                    // We have a float type: use the float parsing function
                    parsedFile[format.name].push(Bytes.ToFloat(format.type as Bytes.Float, dataRegion))
                } else {
                    // We have an int type: use the int parsing function
                    parsedFile[format.name].push(Bytes.ToInt(format.type as Bytes.Int, dataRegion, format.normalize))
                }

                currentByte += elementSize
            }
        })
    }

    return parsedFile
}

async function parseGeometry(url: string)
{
    const TGX = await parseCompressedTGX(url)

    // Loop through the files and parse the data, after all of them have been loaded
    // We do it this way because we have to ensure that render_metadata.js exists prior to doing this

    // render_metadata.js has the properties that we need in order to successfully parse the data
    const renderMetadata = TGX.allFiles['render_metadata.js'] as RenderMetadata

    if(!renderMetadata) {
        console.error('Fatal: render_metadata not found in tgxm')
        return null
    }

    // Extract the instructions on how to actually read the buffers given
    const bufferReadInfo = GetBufferReadInfo(renderMetadata)

    const allFilesParsed = {} as any

    Object.keys(TGX.allFiles)
        .filter((key: string) => key !== 'render_metadata.js')
        .forEach(async (key: string) => {
            const parsed = await parseVertexFileData(TGX.allFiles[key], bufferReadInfo[key])
            allFilesParsed[key] = parsed
        }
    )

    allFilesParsed['render_metadata.js'] = renderMetadata

    return {
        identifier: TGX.identifier,
        data: allFilesParsed
    }
    
}

async function parseTexture(url: string)
{
    // Unless we want to build our own THREE textures, this is just fine
    return await parseCompressedTGX(url)
}

export async function extractAssetInfo(gb: GeometryBody) {

    // First, lets get the gearJs file
    const gearJs = await (await fetch(`${mobileGearCDN.Gear}/${gb.gear[0]}`)).json()

    const parsedGeometries = {} as { [key: string]: any }

    // Now we need to load the geometries
    for(const geometry of gb.content[0].geometry) {
        // Parse the geometry and its underlying components
        const parsedGeometry = await parseGeometry(`${mobileGearCDN.Geometry}/${geometry}`)
        // Map the parsed geometry by its identifier
        if(parsedGeometry) parsedGeometries[parsedGeometry.identifier] = parsedGeometry.data
    }

    parsedGeometries['gear.js'] = gearJs

    const parsedTextures = {} as { [key: string]: any }

    
    // Parse and load the textures
    // Note - this is very slow... is it possible to preload textures somehow?
    
    for(const texture of gb.content[0].textures) {
        const parsedTexture = await parseTexture(`${mobileGearCDN.Texture}/${texture}`)
        parsedTextures[parsedTexture.identifier] = parsedTexture.allFiles
    }
    

    return {
        geometry: parsedGeometries,
        textures: parsedTextures
    }
}