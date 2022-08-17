/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { Handlers, HandlerContext, PageProps } from '$fresh/server.ts'

import { Env } from '@env'
import { tw } from '@twind'
import { D2Root } from '@d2/base.ts'
import { Component, getProfile } from '@d2/get/profile.ts'

import CharacterSelect from '@islands/CharacterSelect.tsx'

interface Params {
    membershipType: string,
    membershipId: string
}

interface CharacterPreview {
    characterId: string,
    name: string,
    emblemPath: string,
    emblemBackgroundPath: string,
    race: string,
    class: string,
    classGifPath: string,
    isFemale: boolean
}

export const handler: Handlers<CharacterPreview[]> = {
    async GET(_req: Request, ctx: HandlerContext<CharacterPreview[]>) {

        const { membershipType, membershipId } = ctx.params

        // Get the characters on this account
        const json = await getProfile(Env.D2APIKey, membershipType, membershipId, [
            Component.Characters, Component.Profiles, Component.ItemSockets
        ]) as Record<string, Record<string, Record<string, any>>>

        // Filter the characters
        const characterData = json['characters']['data']
        const characterIds = Object.keys(characterData)

        // Filter the returned data into usable information 
        const filteredCharacterData: CharacterPreview[] = []

        // Tables required to parse some of the information
        const raceTypes = ['Human', 'Awoken', 'Exo']
        const classTypes = ['Titan', 'Hunter', 'Warlock']
        const classGifs = [
            'https://cdn.discordapp.com/attachments/933863656750473267/999175867810992138/titan-final.gif',
            'https://cdn.discordapp.com/attachments/933863656750473267/999175868461105202/hunter-final.gif',
            'https://cdn.discordapp.com/attachments/933863656750473267/999175868146528296/warlock-final.gif'
        ]


        // TODO: titles are stored in the character titleRecordHash; translate this to a title later.
        for(const id of characterIds) {
            const current = characterData[id]
            filteredCharacterData.push({
                characterId: id,
                name: json['profile']['data']['userInfo']['bungieGlobalDisplayName'],
                emblemPath: `${D2Root}/${current.emblemPath}`,
                emblemBackgroundPath: `${D2Root}/${current.emblemBackgroundPath}`,
                race: raceTypes[current.raceType],
                class: classTypes[current.classType],
                classGifPath: classGifs[current.classType],
                isFemale: Boolean(current.genderType)
            })
        }

        return await ctx.render(filteredCharacterData)
    }
}

// TODO: Make an animation class to deal with the GIFs, as they aren't necessarily synced.
// OR replace them entirely.
// TODO: Make this page look better (background wise)
export default function Page(props: PageProps<CharacterPreview[]>) {
    const characterPreviews = props.data
    return (
        <div class={tw(`flex(& row) bg-gray-800 items-center justify-center gap-8 w-screen h-screen`)}> 
            { characterPreviews.map((val: CharacterPreview, i) => {
                return (
                    <CharacterSelect preview={val} memberType={props.params.membershipType} memberId={props.params.membershipId}/>
                )
            }) } 
        </div>
    )
}
