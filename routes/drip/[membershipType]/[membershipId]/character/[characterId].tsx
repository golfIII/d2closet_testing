/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { Handlers, HandlerContext, PageProps, Handler } from '$fresh/server.ts'

import { tw } from '@twind'
import Stage from '@islands/Stage.tsx'


// A basic item, which could be an armor piece, an ornament, or a shader
interface BasicItem {
    name: string,
    hash: string,
    icon: string
}

// A complete item, including an armor piece, an ornament (null if not present), and a shader (null if not present)
interface CompleteItem {
    armor: BasicItem,
    ornament: BasicItem,
    shader: BasicItem
}

export const handler: Handlers = {
    async GET(req: Request, ctx: HandlerContext) {

        const { membershipType, membershipId, characterId } = ctx.params

        const url = new URL(req.url)

        // Should ALWAYS exist
        const female = url.searchParams.get('female')!
        if(!female) {
            return await ctx.render(null)
        }

        // Initialize the database first, if it hasn't already been initialized
        await fetch(`${url.origin}/api/init`)

        const info = await (await fetch(`${url.origin}/api/${membershipType}/${membershipId}/character/${characterId}?female=${female}`)).json()

        return await ctx.render({
            female: female,
            items: info.items,
            preview: info.preview
        })
    }
}

interface CharacterProps {
    items: CompleteItem[],
    female: boolean
    preview: Record<string, string>
}

export default function Page({ data }: PageProps<CharacterProps>) {

    if(!data) {
        return <div> Invalid request: missing query param 'female' </div>
    }

    // TODO: Move the images into an Island, as we'll need them to be interactive later
    return (
        <div class={tw(`absolute z-40`)}>
            <div class={tw(`flex(& row) absolute w-screen h-screen justify-center items-center gap-2 overflow-hidden bg-gray-800`)}>
                <div class={tw(`h-[418px] border-l-2 border-[#909195] flex(& col) justify-between`)}>
                    { data.items.map((_) => <div class={tw(`w-4 p-px bg-[#909195]`)}></div>) }
                </div>
                
                <div class={tw(`flex(& col) gap-8 items-center`)}>

                    { data.items.map((val) => {
                        return (
                            <div class={tw(`flex(& row) justify-center items-center gap-2`)}>
                                <img loading={'eager'} class={tw(`w-20 p-[2px] bg-[#909195]`)} src={val.armor.icon}/>

                                    <div class={tw(`w-8 p-px bg-[#909195]`)}></div>

                                <img loading={'eager'} class={tw(`w-16 p-[2px] bg-[#909195]`)} src={val.ornament ? val.ornament.icon : 'https://www.bungie.net/common/destiny2_content/icons/4c4f01e77d6ffc68e7353a96dc3cb0aa.png'}/>

                                    <p class={tw(`w-16 text(white)`)}> {val.ornament? val.ornament.name : 'Default Ornament'} </p>

                                    <div class={tw(`w-8`)}></div>

                                <img loading={'eager'} class={tw(`w-16 p-[2px] bg-[#909195]`)} src={val.shader.icon}/>

                                    <p class={tw(`w-16 text(white)`)}> {val.shader.name} </p>
                            </div>
                        )
                    }) } 
                </div>
                <Stage
                    female={data.female}
                    hashes={data.items.map((val) => !val.ornament || val.ornament.name === 'Default Ornament' ? val.armor.hash : val.ornament.hash)}
                />
            </div>

        </div>
    )
}
