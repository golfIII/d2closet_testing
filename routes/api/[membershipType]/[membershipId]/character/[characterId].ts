import { Handlers, HandlerContext } from '$fresh/server.ts'

import { Env } from '@env'
import { D2Root } from '@d2/base.ts'
import { Component, getCharacter } from '@d2/get/character.ts'
import { getProfile } from '@d2/get/profile.ts'
import { D2ManifestDefinition, getDefinition } from '@state/load.ts'

// An item component returned within characters.data.items
// https://bungie-net.github.io/#/components/schemas/Destiny.Entities.Items.DestinyItemComponent
interface D2ItemComponent {
    itemHash: string,
    itemInstanceId: string,
    quantity: number,
    bindStatus: number,
    location: number,
    bucketHash: number,
    transferStatus: number,
    lockable: boolean,
    state: number,
    expirationDate: string,
    isWrapper: boolean,
    tooltipNotificationIndexes: number[],
    metricHash: number,
    metricObjective: Object,
    versionNumber: number,
    itemValueVisibility: boolean[]
}

// Socket, returned by Components.ItemSockets
interface D2APISocketInfo {
    plugHash:  number,
    isEnabled: boolean,
    isVisible: boolean
}

// A basic item, which could be an armor piece, an ornament, or a shader
interface BasicItem {
    name: string,
    hash: string,
    icon: string
}

// A complete item, including an armor piece, an ornament (null if not present), and a shader (null if not present)
interface CompleteItem {
    armor: BasicItem,
    ornament: BasicItem | null,
    shader: BasicItem | null
}

function parseSockets(sockets: Partial<D2APISocketInfo>[])
{
    let ornament: BasicItem | null = null
    let shader: BasicItem | null = null

    for(const socket of sockets) {
        if(!socket.isEnabled || !socket.isVisible || !socket.plugHash)
            continue

        // Check the baseline info of this socket
        const socketInfo = getDefinition(D2ManifestDefinition.DestinyInventoryItemDefinition, socket.plugHash.toString())

        const socketBasicItem: BasicItem = {
            name: socketInfo.displayProperties.name,
            hash: socketInfo.hash,
            icon: socketInfo.displayProperties.hasIcon ? (D2Root + socketInfo.displayProperties.icon) : 'https://www.bungie.net/img/misc/missing_icon_d2.png'
        }

        if(socketInfo.itemType === 2 || (socketInfo.itemType === 19 && socketInfo.itemSubType === 21)) {
            // Armor piece; this is our ornament
            // The second case is if it is an exotic ornament
            ornament = socketBasicItem
        } else if(socketInfo.itemType === 19 && socketInfo.itemSubType === 20) {
            // Shader
            shader = socketBasicItem
        }
    }

    return {
        ornament: ornament,
        shader: shader
    }
}


export const handler: Handlers = {
    async GET(req: Request, ctx: HandlerContext) {
        const { membershipType, membershipId, characterId } = ctx.params

        const url = new URL(req.url)

        const female = url.searchParams.get('female')!
        if(!female) {
            return new Response('Error: \'female\' querystring not provided', {
                status: 404,
                statusText: 'Error: \'female\' querystring not provided'
            })
        }

        // Get the character via the d2 endpoint
        const character = await getCharacter(Env.D2APIKey, membershipType, membershipId, characterId, [
            Component.CharacterEquipment, Component.ItemSockets, Component.ItemInstances, 
            Component.Characters
        ])

        if(!character) {
            return new Response('Error: Unable to find character', {
                status: 404,
                statusText: 'Error: Unable to find character'
            })
        }

        const items = character['equipment']['data']['items'] as D2ItemComponent[]

        const itemList: CompleteItem[] = []

        // Parse the items, filtering out anything that isn't an armor piece.
        for(const item of items) {
            const itemData = getDefinition(D2ManifestDefinition.DestinyInventoryItemDefinition, item.itemHash)
            // Only one itemType is relevant here; armor (2)
            if(itemData.itemType === 2) {
                // We have armor; save the baseline information

                const armorBasicItem: BasicItem = {
                    name: itemData.displayProperties.name,
                    hash: itemData.hash,
                    icon: itemData.displayProperties.hasIcon ? (D2Root + itemData.displayProperties.icon) : 'https://www.bungie.net/img/misc/missing_icon_d2.png'
                }

                // Use the instanceId to key character['itemComponents']['sockets']['data']
                // And search the sockets
                const sockets = character['itemComponents']['sockets']['data'][item.itemInstanceId]['sockets'] as Partial<D2APISocketInfo>[]

                const { ornament, shader } = parseSockets(sockets)

                itemList.push({
                    armor: armorBasicItem,
                    ornament: ornament,
                    shader: shader
                })
            }
        }

        // TODO: Code duplication here: we get the emblem, name, and race twice; once in the character select island,
        // and now once here. I'm not sure how to consolidate the two into a usable format.

        const profileInfo = await getProfile(Env.D2APIKey, membershipType, membershipId, [
            Component.Profiles
        ])

        const characterInfo = character['character']['data']

        const raceTypes = ['Human', 'Awoken', 'Exo']
        const classTypes = ['Titan', 'Hunter', 'Warlock']

        const characterPreview = {
            name: profileInfo!['profile']['data']['userInfo']['displayName'],
            emblemPath: `${D2Root}/${characterInfo.emblemPath}`,
            emblemBackgroundPath: `${D2Root}/${characterInfo.emblemBackgroundPath}`,
            race: raceTypes[characterInfo.raceType],
            class: classTypes[characterInfo.classType],
        }

        const response = {
            items: itemList,
            preview: characterPreview
        }

        return new Response(JSON.stringify(response), {
            status: 200,
            statusText: 'OK'
        })
    }
}