// Initializes the database

import { Handlers, HandlerContext } from '$fresh/server.ts'

import { initStore, getAssetInfo } from '@state/load.ts'

import { extractAssetInfo } from '@d2/render/extract_asset_info.ts'

export const handler: Handlers = {
    async GET(req: Request, _ctx: HandlerContext): Promise<Response> {
        
        const start = Date.now()

        // Make sure that the DBs are initialized
        await initStore()

        const url = new URL(req.url)

        const idStrs = url.searchParams.get('ids')

        if(!idStrs) {
            return new Response('Failed to provide IDs', {
                status: 404,
                statusText: 'Failed to provide IDs'
            })
        }

        const ids = idStrs.split(',')

        const allParsed = {} as Record<string, any>

        for(const id of ids) {
            // We sadly have to return the armor type for our pieces, in order to get an idea for the offset

            // Get the gear info
            const info = getAssetInfo(id)

            // Use this to get the parsed info
            const parsed = await extractAssetInfo(info)

            allParsed[id] = parsed
        }


        const elapsed = Date.now() - start

        console.log(`Renderdata completed in ${elapsed / 1000} seconds.`)

        return new Response(JSON.stringify(allParsed), {
            status: 200,
            statusText: 'OK'
        })
    }
}