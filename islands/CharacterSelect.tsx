/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { useEffect, useState } from '$preact/hooks'

import { tw } from '@twind'

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

interface PreviewProp {
    memberType: string,
    memberId: string,
    preview: CharacterPreview
}

export default function CharacterSelect(params: PreviewProp) {

    function handleCharacterSelect() {
        // Navigate to the specific character page
        window.location.href = `${window.location.origin}/drip/${params.memberType}/${params.memberId}/character/${params.preview.characterId}?female=${params.preview.isFemale}`
    }

    return (
        <div 
            class={tw(`flex(& col) h-11/12 w-1/5 grow hover:(scale-105 cursor-pointer) shadow-lg ease-in-out duration-200 text-xs`)}
            onClick={handleCharacterSelect}
        >
            <div
                style={{'backgroundImage': `url('${params.preview.emblemBackgroundPath}')`}}
                class={tw(`p-[1.5vw] bg-cover flex(& col) shrink-0 w-full min-h-fit justify-center`)}
                loading={'eager'}
            >
                <p class={tw(`text-white ml-[3.5vw]`)}> {params.preview.name} </p>
                <p class={tw(`text-white ml-[3.5vw] italic`)}> {params.preview.race} {params.preview.class} </p>
            </div>
            <img
                src={params.preview.classGifPath}
                loading={'eager'}
            />
        </div>
    )
}