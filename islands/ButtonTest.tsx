/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { useEffect, useState } from '$preact/hooks'

import { tw } from '@twind'

export default function ButtonTest() {
    return (
        <button
            class={tw(`px-10 py-3 hover(px-11 py-4) border(2 white) rounded-full text-orange-300 bg-white w-64`)}
            onClick={() => console.log('yeah')}
        >
            Login
        </button>
    )
}