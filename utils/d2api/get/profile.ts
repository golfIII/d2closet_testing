// Implementation of getProfile

import { D2APIRoot, D2APIResponse } from '@d2/base.ts'
import { Component } from '@d2/components.ts'

// Response returned by getProfile
// https://bungie-net.github.io/#/components/schemas/Destiny.Responses.DestinyProfileResponse
export interface D2APIProfileResponse {
    // This is too large to implement, sadly.
    [key: string]: any
}

// getProfile, dependent on components
export { Component }
export async function getProfile(token: string, type: string, id: string, components: Component[]): Promise<D2APIProfileResponse | null> {

    if(components.length < 1) {
        console.error('Must have at least one component for getProfile')
        return null
    }

    const componentsString = components.join(',')

    const json: D2APIResponse<D2APIProfileResponse | null> = 
        await (await fetch(`${D2APIRoot}/Destiny2/${type}/Profile/${id}?components=${componentsString}`, {
            headers: {
                'X-API-Key': token
            }
        })).json()

    return json.Response || null
}