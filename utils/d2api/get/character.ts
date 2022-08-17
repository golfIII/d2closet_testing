// Implementation of getCharacter

import { D2APIRoot, D2APIResponse } from '@d2/base.ts'
import { Component } from '@d2/components.ts'

// Response returned by getCharacter
// https://bungie-net.github.io/#/components/schemas/Destiny.Responses.DestinyCharacterResponse
export interface D2APICharacterResponse {
    // This is too large to implement, sadly.
    [key: string]: any
}

// getCharacter, dependent on components
export { Component }
export async function getCharacter(token: string, type: string, profileId: string, characterId: string, components: Component[]): Promise<D2APICharacterResponse | null> {

    if(components.length < 1) {
        console.error('Must have at least one component for getCharacter')
        return null
    }

    const componentsString = components.join(',')

    const json: D2APIResponse<D2APICharacterResponse | null> = 
        await (await fetch(`${D2APIRoot}/Destiny2/${type}/Profile/${profileId}/Character/${characterId}?components=${componentsString}`, {
            headers: {
                'X-API-Key': token
            }
        })).json()

    return json.Response || null
}