/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { useLayoutEffect, useEffect, useRef, useState } from '$preact/hooks'
import * as THREE from '$three'

import { tw } from '@twind'
import { OrbitControls } from '@three-utils/orbit.ts'

// Utility functions to parse the data returned by the API
function filterByGender(info: any, female: boolean) {
    const geometryLocation = (female) ? 'female_override_art_arrangement' : 'base_art_arrangement'
    const geometryHashes = info.geometry['gear.js'].art_content_sets[0].arrangement.gear_set[geometryLocation].geometry_hashes as string[]

    const result: Record<string, any> = {}

    result['geometry'] = {} as Record<string, any>

    geometryHashes.forEach((hash: string) => {
        result['geometry'][hash] = (info.geometry[hash])
    })

    result['gear.js'] = info.geometry['gear.js']

    result['textures'] = info.textures

    return result
}

function triangulateStrips(indices: number[]) {

    if(indices.length === 3)
        return indices

    const result: number[] = []

    for(let i = 0; i < indices.length - 2; ++i) {
        if(i & 1) {
            // Apply the odd offset
            
            result.push(...[
                indices[i + 1],
                indices[i + 0],
                indices[i + 2]
            ])

        } else {
            // Apply the even offset
            result.push(...[
                indices[i + 0],
                indices[i + 1],
                indices[i + 2]
            ])
        }
    }

    return result
}

// TODO: Filter out duplicate stage parts
function parseStageParts(geometry: Record<string, any>) {
    const indices = geometry['0.indexbuffer.tgx']['index_buffer'] as Uint8Array

    const stagePartList = geometry['render_metadata.js'].render_model.render_meshes[0].stage_part_list

    const outStageParts = []

    // Used to check for duplicate stage parts
    const stagePartStartIndexList: number[] = []

    console.table(stagePartList)

    // TODO: Stage parts contain a gear_dye_change_color_index, which, in conjunction with the selected gear slot
    // allows for a color for this stage part to be produced.
    // I'm not really sure how to implement this; likely send out which color to use (primary, secondary, etc)
    // And then use that to modify the texture directly?
    // I'm not sure if this is really that good of an Idea either though. Maybe, for now, try producing a 
    // separate mesh for each stage part, and then
    // 

    for(const stagePart of stagePartList) {

        // Ignore duplicate stage parts
        if(stagePartStartIndexList.indexOf(stagePart.start_index) !== -1) {
            console.log('encountered duplicate stage part - skipping')
            continue
        }

        stagePartStartIndexList.push(stagePart.start_index)

        const rangedIndices = indices.slice(stagePart.start_index, stagePart.start_index + stagePart.index_count)

        const parsed: number[] = []

        // Split the indices by 65535, which indicates the end of a triangle strip
        const indicesString = rangedIndices.toString().split('65535')
        indicesString.forEach((val: string, i: number) => {
            // The first value has a trailing comma
            // The last value has a leading comma
            // All intermediates have both
            if(i === 0) val = val.slice(0, -1)
            else if(i === indicesString.length - 1) val = val.slice(-1)
            else val = val.slice(1, -1)

            const resultIndices = val.split(',').map(Number)
            const triangulated = (stagePart.primitive_type === 5) ? triangulateStrips(resultIndices) : resultIndices

            parsed.push(...triangulated)
        })

        outStageParts.push({
            partSource: stagePart,
            prim: stagePart.primitive_type,
            indices: parsed,
            gearDyeChangeColor: stagePart.gear_dye_change_color_index
        })
    }

    return outStageParts
}


function parsePartInfo(geometry: Record<string, any>, parts: any[]) {

    // Position, normal, tangent
    const vertex0 = geometry['0.0.vertexbuffer.tgx']
    // Texcoord
    const vertex1 = geometry['0.1.vertexbuffer.tgx']


    const position = []
    // Per https://discord.com/channels/514059860489404417/514419766799237120/1003899426189885490, we ignore the scale and offset
    for(let i = 0; i < vertex0.position.length; i += 4) {
        position.push([
            vertex0.position[i],
            vertex0.position[i+1],
            vertex0.position[i+2],
        ])
    }

    // lowlines inverts the normals, not quite sure why
    const normal = []
    for(let i = 0; i < vertex0.normal.length; i += 4) {
        normal.push([
            vertex0.normal[i],
            vertex0.normal[i+1],
            vertex0.normal[i+2],
        ])
    }

    // UVs need to be offset
    const uv = []
    const uvScale = geometry['render_metadata.js'].render_model.render_meshes[0].texcoord_offset
    const uvOffset = geometry['render_metadata.js'].render_model.render_meshes[0].texcoord_scale

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max))

    for(let i = 0; i < vertex1.texcoord.length; i += 2) {
       // Credit to solo in the ripping server for mentioning charm; it seems like there's a weird transformation done to the texcoord data...
       // the v coordinate = v * -vScale + 1 - vOffset
       // this is equivalent to 1 - (v*vScale + vOffset)
       // Here: https://github.com/MontagueM/Charm/blob/6eacb004b288e547bff8cae10727e42c209a7fe0/Field/Entities/EntityModel.cs#L163
        uv.push([
            (vertex1.texcoord[i]*uvScale[0]+uvOffset[0]),
            1-(vertex1.texcoord[i+1]*uvScale[1]+uvOffset[1])
        ])
    }
    
    const totalPosition: number[] = []
    const totalNormal: number[] = []
    const totalTangent: number[] = []
    const totalTexcoord: number[] = []

    for(const stagePart of parts) {
        // Loop through each index, and insert the vertex info into its respective array
        for(const index of stagePart.indices) {

            // Insert the positions, normals, and UVs
            totalPosition.push(...position[index])
            totalNormal.push(...normal[index])
            totalTexcoord.push(...uv[index])

            // Insert the tangents
            // totalTangent.push(vertex0.tangent[index])
        }
    }

    // Filter further
    const uonly = totalTexcoord.filter((_, i) => i % 2 === 0)
    const vonly = totalTexcoord.filter((_, i) => i % 2 === 1)
    const umax = Math.max(...uonly)
    const vmax = Math.max(...vonly)
    console.log('U min', Math.min(...uonly))
    console.log('U max', Math.max(...uonly))
    console.log('V min', Math.min(...vonly))
    console.log('V max', Math.max(...vonly))

    // Normalize the UVs
    /*
    const filteredTexcoord = totalTexcoord.map((val, i) => {
        if(i % 2 === 0) {
            return val / umax
        } else {
            return val / vmax
        }
    })
    */

    // Maybe force normalize the UVs based on the UV max?

    return {
        totalPosition: totalPosition,
        totalNormal: totalNormal,
        totalTangent: totalTangent,
        totalTexcoord: totalTexcoord
    }
}

// TODO: This method is insanely slow because of the recreation of multiple canvases, as well as the
// requirement for them to be converted into data URLs. 
// Findings 8/4: Many of these textures come from larger plates containing multiple different sets.
// Its likely that you need to combine ALL of the armor into one single mesh, and then
// build the whole texture plate, like below:
// https://lowlidev.com.au/blog/articles/porting-spasm-to-threejs/images/siggraph_plate_set_warlock.png
// Only issue is that this doesn't quite seem to hold anymore.
async function createTexturePlates(geometry: Record<string, any>, textures: Record<string, any>, rawGeometry: Record<string, any>, female: boolean) {
    let texturePlate = geometry['render_metadata.js'].texture_plates[0]

    // FIXME: This is likely not a very good way to get texture plates from the object
    // if we fail to find o
    if(!texturePlate) {
        /*
        // We need to find the texture plate, which is likely located on another area
        const geometryHashes = Object.keys(rawGeometry['geometry'])
        for(const hash of geometryHashes) {
            // Check if a the above property exists
            const possibleTexturePlate = rawGeometry['geometry'][hash]['render_metadata.js'].texture_plates[0]
            if(possibleTexturePlate) {
                texturePlate = possibleTexturePlate
                break
            }
        }
        // We failed to find a texture plate
        if(!texturePlate) {
            console.log('failed to find texture plate')
            return null
        }*/
        // try getting the plates from the opposite gender
        const other = filterByGender(rawGeometry, !female)

        if(!texturePlate)
            return null
    }

    const outPlates = {} as Record<string, any>
    
    // Manually create a canvas for our elements
    const canvas = document.createElement('canvas')

    console.log(texturePlate.gear_slot_requires_plating)

    for(const plateSetName of Object.keys(texturePlate.plate_set)) {
        const currentPlate = texturePlate.plate_set[plateSetName]

        canvas.width = currentPlate.plate_size[0]
        canvas.height = currentPlate.plate_size[1]

        
        // If there's only one texture placement present on the plate, just draw that image and return the resulting plate.
        /*
        if(currentPlate.texture_placements.length === 1) {
            const placement = currentPlate.texture_placements[0]
            canvas.width = placement.texture_size_x 
            canvas.height = placement.texture_size_y
        }
        */

        const context = canvas.getContext('2d')

        if(!context)
            return

        context.fillStyle = '#FFFFFF'
        // Zero out the canvas
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.fillStyle = '#FFFFFF'

        // FIXME: Good news: texture plates now work perfectly.
        // Bad news: newer texture formats don't seem to be solved, and don't work that well

        // Loop through the texture placements and add them to the context
        for(const placement of currentPlate.texture_placements) {
            // Get the image associated with this placement
            // The name of the image is the name of the folder containing it,
            // appended with _{number}
            const foldername = placement.texture_tag_name.slice(0,-2)
            // Convert texture from object to array, then convert the array to a blob
            const textureData = new Blob([new Int8Array(Object.values(textures[foldername][placement.texture_tag_name]))])
            // Use this blob to construct an image
            const textureImage = await createImageBitmap(textureData)
            // Write the image to the area on the canvas

            // Now, before doing the context calls, we need to check for 2 specific things:
            // 1. If there's only one texture plate
            // 2. If the texture plate only takes up half of the total image width
            // If these two conditions are met, we need to reflect the image vertically.
            
            /*
            if(currentPlate.texture_placements.length === 1 &&
                (placement.texture_size_x * placement.texture_size_y) === (currentPlate.plate_size[0] * currentPlate.plate_size[1] / 2)
            ) {
                console.log('FLIP REQUIRED')

                // Create a new context that will store a flipped version of the image
                const flipCanvas = document.createElement('canvas')
                flipCanvas.width = placement.texture_size_x 
                flipCanvas.height = placement.texture_size_y

                const flipContext = flipCanvas.getContext('2d')!

                // Flip the context
                flipContext.translate(0, placement.texture_size_y)
                flipContext.scale(1, -1)

                flipContext.drawImage(textureImage, 
                    0, 0,
                    placement.texture_size_x, placement.texture_size_y 
                )

                // Draw the image
                // TODO: Figure out the new placement positions
                context.drawImage(flipCanvas, 
                    0,
                    0,
                    placement.texture_size_x, placement.texture_size_y
                )
            }
            */

            context.drawImage(textureImage, 
                placement.position_x, placement.position_y, 
                placement.texture_size_x, placement.texture_size_y
            )
        }

        // Convert our canvas into an image URI and append to the total plates
        outPlates[plateSetName] = canvas.toDataURL()
    }

    return outPlates
}

async function createRenderMesh(rawGeometry: Record<string, string>, female: boolean) {
    const loader = new THREE.TextureLoader()

    console.log(rawGeometry)

    // Filter the geometry by the gender
    const filtered = filterByGender(rawGeometry, female)

    const meshList: THREE.Mesh[] = []

    // Create a mesh for each of the filtered items
    for(const val of Object.keys(filtered.geometry)) {
        const geometry = filtered.geometry[val]
        const bufferGeometry = new THREE.BufferGeometry()

        const stageParts = parseStageParts(geometry)
        // Parse the stage parts into triangulated data
        const parsedData = parsePartInfo(geometry, stageParts)

        console.log(parsedData)

        // Add this triangulated data into our mesh
        bufferGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(parsedData.totalPosition), 3))
        bufferGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(parsedData.totalNormal), 3))
        bufferGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(parsedData.totalTexcoord), 2))

        // Load the textures and create texture plates when needed
        const plates = await createTexturePlates(geometry, filtered.textures, rawGeometry, female)

        const material = new THREE.MeshPhongMaterial( { color: 0xffffff } )
        
        if(plates) {
            console.log(plates['diffuse'])
            material.map = loader.load(plates['diffuse'])
            material.map.wrapS = THREE.RepeatWrapping
            material.map.wrapT = THREE.RepeatWrapping

            material.normalMap = loader.load(plates['normal'])
            material.transparent = false

        }
        
        const mesh = new THREE.Mesh(bufferGeometry, material)

        mesh.rotation.z = - Math.PI / 2
        mesh.rotation.x = Math.PI * 3 / 2

        meshList.push(mesh)
    }

    return meshList
}

// Creates the render meshes, with each stagePart getting its own mesh. This is based off of the information
// present within the gearDyeChangeColor and gearDyeSlot.
// The former is decided in the stagepart, and the latter in the gearjs file.
function createRenderMeshSeparate(rawGeometry: Record<string, string>, female: boolean) {
    const loader = new THREE.TextureLoader()

    // 

    // Filter the geometry by the gender
    const filtered = filterByGender(rawGeometry, female) 
}

// TODO: Once shaders are working, force those to be props as well
interface StageProps {
    hashes: string[]
    female: boolean
}

interface LoadingScreenProps {
    message: string | null
}

function StageLoading(props: LoadingScreenProps) {

    return (
        <div class={tw(`flex(& col) items-center`)}>
            <div class={tw(`flex gap-4`)}>
                <img 
                    src='/loading-triangle.svg'
                    class={tw(`inline-block h-20 fill-white`)}
                />
            </div>
            <p class={tw(`text-white`)}>Loading { props.message }...</p>
        </div>
    )
}

export default function Stage(props: StageProps) {

    const anchorRef = useRef<HTMLCanvasElement>(null)

    const [isDone, setDoneStatus] = useState<boolean>(false)
    const [loadingState, setLoadingState] = useState<string>('page')

    // Initialize the stage after the stage anchor has mounted
    useLayoutEffect(() => {
        if(!anchorRef.current) {
            return
        }

        setLoadingState('scene setup props')

        const stageWidth = window.innerWidth * 0.3 
        const stageHeight = window.innerHeight * 0.8 

        const scene = new THREE.Scene()
        const cam = new THREE.PerspectiveCamera(75, stageWidth/stageHeight, 0.1, 1000)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.15)
        const directionalLight = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
        scene.add(ambientLight)
        scene.add(directionalLight)

        cam.position.x = 0
        cam.position.z = 1.5
        cam.position.y = 1.25
        
        const renderer = new THREE.WebGLRenderer({
            canvas: anchorRef.current!
        })

        renderer.setSize(stageWidth, stageHeight)

        setLoadingState('armor render data')

        // Get the geometry info for the hashes
        const ids = props.hashes.join(',')
        fetch(`${window.origin}/api/renderdata?ids=${ids}`).then(resp => resp.json().then(async (renderInfo) => {
            console.log(renderInfo)
            setLoadingState('meshes')

            for(const itemId of Object.keys(renderInfo)) {
                const item = renderInfo[itemId]
                const meshes = await createRenderMesh(item, props.female)

                scene.add(...meshes)
            }


            // FIXME: Various armor pieces don't show until the scene is moved, for some reason.


            setLoadingState('done')
            setDoneStatus(true)

            const controls = new OrbitControls(cam, renderer.domElement)
            controls.maxDistance = 1.65
            controls.minDistance = 1.65
            controls.panSpeed = 0 // prevent panning for now
            
            controls.target = new THREE.Vector3(0, 1, 0)
            controls.update()
            
            function animate() {
                requestAnimationFrame(animate)

                controls.update()
                renderer.render(scene, cam)
            }
            animate()
        }))
    }, [])


    return (
        <>
            <div
                style={{'display': isDone ? 'none' : 'flex'}}
                class={tw(`bg-gray-500 absolute top-0 left-0 justify-center items-center w-screen h-screen z-50`)}
            >
                <StageLoading message={loadingState}/> 
            </div>

            <canvas
                ref={anchorRef}
                class={tw(`ml-20 h-[80vh] w-[30vw] bg-black`)}
            >
            </canvas>
        </>
    )
}