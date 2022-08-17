/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { useRef, useState } from '$preact/hooks'

import { Env } from '@env'
import { tw } from '@twind'
import { ModalType, showModal } from '@islands/ModalContainer.tsx'
import { userSearchTag } from '@d2/post/search.ts'

export default function FormTest() {

    const inputRef = useRef<HTMLInputElement>(null)

    async function handleSearch(e: Event) {
        e.preventDefault()

        if(!inputRef) return

        const val = inputRef.current?.value

        if(!val) return

        const [name, tag] = val.split('#')

        if(!tag) {
            showModal({
                type: ModalType.Error,
                text: 'No tag provided: be sure to have your name in the format Guardian#1234'
            })
            inputRef.current.value = ''
            return
        }

        const result = await userSearchTag(Env.D2APIKey, name, tag)
        if(!result) {
            showModal({
                type: ModalType.Error,
                text: `Failed to find guardian ${name}#${tag}`
            })
            inputRef.current.value = ''
            return
        }

        // All we really care about is the membershipId and membershipType
        const m = result.destinyMemberships[0]
        // Route to the characters page
        // TODO: Force route to home on invalid location (ie, if the user tries to go to /drip without an id.)
        window.location.href = `${window.location.origin}/drip/${m.membershipType}/${m.membershipId}`
    }

    return (
        <form
            onSubmit={handleSearch}>
            <input 
                type='text'
                autoComplete='off'
                placeholder='Find Guardian#1234'
                class={tw(`outline-none bg-transparent w-64 px-10 py-3 focus:(placeholder-none outline-none px-11 py-4) border(2 white) rounded-full text(white center) placeholder-white ease-in-out duration-300`)}
                ref={inputRef}
            ></input>
        </form>
    )
}