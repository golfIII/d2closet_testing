// Initializes the database

import { Handlers, HandlerContext } from '$fresh/server.ts'

import { initStore } from '@state/load.ts'

const sleep = (sec: number): Promise<void> => {
    return new Promise((resolve, _) => {
        setTimeout(() => {
            resolve()
        }, sec * 1000)
    })
}

export const handler: Handlers = {
    async GET(_req: Request, _ctx: HandlerContext): Promise<Response> {
        
        const start = Date.now()

        await initStore()

        const elapsed = Date.now() - start

        console.log(`Finished db initialization in ${elapsed / 1000} seconds.`)

        return new Response(JSON.stringify({
            loadedSuccessfully: true,
            elapsed: elapsed / 1000
        }), {
            status: 200,
            statusText: 'OK'
        })
    }
}