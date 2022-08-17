import { Env } from '@env'
import { Component, getProfile } from '@d2/get/profile.ts'
import { D2ManifestDefinition } from '@state/load.ts'

// Load the manifest
const manifestDatabase = JSON.parse(Deno.readTextFileSync('../state/aggregate-a8407fb4-3792-44e0-9679-932fbe520b1b.json'))

export function getDefinition(type: D2ManifestDefinition, id: string) {
    if(!manifestDatabase) {
        console.error('Attempted to get from manifestDatabase prior to initialization')
        return null
    }
    return manifestDatabase[type][id] || null
}

console.time('filter items')

// My profile
const profile = await getProfile(Env.D2APIKey, '3', '4611686018483886352', [
    Component.ItemSockets
])

interface PlugItem {
    plugItemHash: number,
    canInsert: boolean,
    enabled: boolean
}

// Get the characterPlugSet for my hunter
// const plugs = profile!.characterPlugSets.data['2305843009554484470'].plugs as Record<string, PlugItem[]>
const plugs = profile!.profilePlugSets.data.plugs

const shaders = []
const transmoggedItems = {
    hunter: {
        head: [],
        chest: [],
        arms: [],
        legs: [],
        class: []
    },
    warlock: {
        head: [],
        chest: [],
        arms: [],
        legs: [],
        class: []
    },
    titan: {
        head: [],
        chest: [],
        arms: [],
        legs: [],
        class: []
    }
}

// Loop through each plug set
for(const plugSetHash of Object.keys(plugs)) {
    // const definition = getDefinition(D2ManifestDefinition.DestinyPlugSetDefinition, plugSetHash)
    for(const plugItem of plugs[plugSetHash] as PlugItem[]) {
        const info = getDefinition(D2ManifestDefinition.DestinyInventoryItemDefinition, plugItem.plugItemHash.toString())
        if(!info)
            continue
        // canInsert tells us if we've transmogged the item
        // but this gives us a comprehensive list of every single item that we've transmogged
        // this also only gives us the shaders that we have, which is perfect.

        if(!plugItem.canInsert)
            continue

        if(info.itemSubType === 20) {
            // Shader
            shaders.push({
                name: info.displayProperties.name
            })
        } else {
            // Armor
            if(info.itemSubType === 21) {
                // Use the plug info to find out where this should go
                // console.log(info)
                if(plugItem.canInsert) {

                    const [className, armorSlot] = info.plug.plugCategoryIdentifier.split('_').slice(-2)

                    if(!Object.keys(transmoggedItems).includes(className) || 
                       !Object.keys(transmoggedItems.hunter).includes(armorSlot)) {
                        continue
                        // Don't add
                    }

                    console.log(className, armorSlot)

                    // @ts-ignore
                    transmoggedItems[className][armorSlot].push({
                        name: info.displayProperties.name
                    })
                }
            } else if(info.itemType === 2) {
                // Just an armor piece; we can just use the normal aspects to find out where it goes
                const classLookupTable = ['titan', 'hunter', 'warlock']
                const armorPieceLookupTable = {
                    26: 'head',
                    27: 'arms',
                    28: 'chest',
                    29: 'legs',
                    30: 'class'
                }

                const className = classLookupTable[info.classType]
                // @ts-ignore
                const armorSlot = armorPieceLookupTable[info.itemSubType]
                // @ts-ignore
                transmoggedItems[className][armorSlot].push({
                    name: info.displayProperties.name
                })

            }
        }

        // console.log('Name', info.displayProperties.name, 'canInsert', plugItem.canInsert, 'enabled', plugItem.enabled)
    }
}


if(profile) {

    Deno.writeTextFileSync('profile.json', JSON.stringify({
        shaders: shaders,
        transmoggedItems: transmoggedItems
    }))
}

console.timeEnd('filter items')