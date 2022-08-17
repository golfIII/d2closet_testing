// Load the databases required for the API
import { basename } from '$path'
import { unZipFromURL } from '$zip'
import { DB } from '$sqlite'

import { Env } from '@env'
import { D2Root } from '@d2/base.ts'
import { D2ManifestDefinition, getManifest } from '@d2/get/manifest.ts'

const last = <T>(arr: T[]) => arr[arr.length - 1]

let manifestDatabase: Record<string, Record<string, any>> | null = null
export let gearAssetDatabase: DB | null = null


// TODO: Close the gearAssetDatabase
export async function initStore() {
    const json = await getManifest(Env.D2APIKey)

    if(!json.Response) {
        console.error('Error loading manifest', json)
        return
    }

    console.log(json.Response.version)

    // Check the manifest version against the saved version, if it exists
    let reloadManifest = false

    try {
        // Please note: all paths are relative to cwd (main.ts)
        const versionFile = JSON.parse(Deno.readTextFileSync('./state/manifest-metadata.json'))

        if(versionFile.version !== json.Response.version) {
            // Different manifest detected; redownload required files
            console.log('Different manifest version detected')

            reloadManifest = true
        }
    } catch(error) {
        // File doesn't exist, create it and download the required manifest files
        reloadManifest = true
    }

    const manifestPath = json.Response.jsonWorldContentPaths['en']
    const manifestFilename = basename(manifestPath)
    console.log(manifestFilename)

    // We get the latest gearAssetDatabase by default
    const gearAssetPath = last(json.Response.mobileGearAssetDataBases).path
    const gearAssetFilename = basename(gearAssetPath)

    if(reloadManifest) {
        // Write the manifest version into our metadata file
        const versionInfo = { version: json.Response.version }
        Deno.writeTextFileSync('./state/manifest-metadata.json', JSON.stringify(versionInfo))

        // Load and save the manifest first
        const manifestJson = await (await fetch(`${D2Root}${manifestPath}`)).json()
        Deno.writeTextFileSync(`./state/${manifestFilename}`, JSON.stringify(manifestJson))

        console.log(`${D2Root}${gearAssetPath}`)
        // Load and save the gear asset database
        await unZipFromURL(`${D2Root}${gearAssetPath}`) 
        // Force reset 
        manifestDatabase = null
        gearAssetDatabase = null
    }

    // Lastly, load these files into our session variables
    // TODO: Move the location of the gearAssetDatabase, as it only successfully saves in cwd
    if(!manifestDatabase) manifestDatabase = JSON.parse(Deno.readTextFileSync(`./state/${manifestFilename}`))
    if(!gearAssetDatabase) gearAssetDatabase = new DB(`./${gearAssetFilename}`)
}

export function closeStore() {
    gearAssetDatabase?.close()
}

// Query the mobile assets DB
export function getAssetInfo(id: number | string) {

    if(!gearAssetDatabase) {
        console.error('Attempted to get from gearAssetDatabase prior to initialization')
        return null
    }

    if(typeof id === 'string')
        id = parseInt(id)

    // d2api IDs are u32s, sqlite stores s32s. Convert our id:
    const s32Id = (new Int32Array([id]))[0]

    // Query normally
    const tableName = 'DestinyGearAssetsDefinition'

    const queryString = `SELECT json FROM ${tableName} WHERE id = ${s32Id}`

    const queryResult = gearAssetDatabase.query(queryString)

    if(queryResult.length < 1)
        return null
    else
        return JSON.parse(String(queryResult[0][0]))
}

// Query the manifest
export { D2ManifestDefinition }
export function getDefinition(type: D2ManifestDefinition, id: string) {
    if(!manifestDatabase) {
        console.error('Attempted to get from manifestDatabase prior to initialization')
        return null
    }
    return manifestDatabase[type][id] || null
}