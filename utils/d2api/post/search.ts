// User search functionality

import { D2APIRoot, D2APIResponse } from '@d2/base.ts'

export interface D2APIUserSearchResult {
    bungieGlobalDisplayName: string,
    bungieGlobalDisplayNameCode: number,
    bungieNetMembershipId: string,
    destinyMemberships: {
        supplementalDisplayName: string,
        iconPath: string,
        crossSaveOverride: number,
        applicableMembershipTypes: number[],
        isPublic: boolean,
        membershipType: number,
        membershipId: number,
        displayName: string,
        bungieGlobalDisplayName: string,
        bungieGlobalDisplayNameCode: number
    }[]
}

// Inner response for the userSearch endpoint
// https://bungie-net.github.io/#/components/schemas/User.UserSearchResponse
export interface D2APIUserSearchResponse {
    searchResults: D2APIUserSearchResult[],
    page: number,
    hasMore: boolean
}

export async function userSearch(token: string, name: string): Promise<D2APIUserSearchResult[]> {
    // Get all of the results, from all of the pages. It is up to the user to paginate
    // these results.
    const results: D2APIUserSearchResult[] = []

    let page = 0

    while(true) {
        const json: D2APIResponse<D2APIUserSearchResponse | null> = 
        await (await fetch(`${D2APIRoot}/User/Search/GlobalName/${page++}/`, {
            method: 'POST',
            headers: {
                'X-API-Key': token
            },
            body: JSON.stringify({ displayNamePrefix: name })
        })).json()

        if(json.Response) {
            results.push(...json.Response.searchResults)
            if(!json.Response.hasMore)
                break
        } else {
            break
        }
    }

    return results
}

// Filters userSearch by an individual with a specific tag
export async function userSearchTag(token: string, name: string, tag: string): Promise<D2APIUserSearchResult | null> {
    const results = await userSearch(token, name)

    console.log(results)

    for(const result of results) {
        if(result.bungieGlobalDisplayNameCode.toString() === tag)
            return result
    }

    return null
}