// Initializes the database

import { Handlers, HandlerContext } from '$fresh/server.ts'

import { closeStore } from '@state/load.ts'

export const handler: Handlers = {
    async GET(_req: Request, _ctx: HandlerContext): Promise<Response> {
        
        const start = Date.now()

        // closeStore()

        const elapsed = Date.now() - start

        console.log(`Finished db closing in ${elapsed / 1000} seconds.`)

        return new Response(JSON.stringify({
            loadedSuccessfully: true,
            elapsed: elapsed / 1000
        }), {
            status: 200,
            statusText: 'OK'
        })
    }
}