/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'

import { tw } from '@twind'
import APILoader from '@islands/APILoader.tsx'
import FormTest from '@islands/FormTest.tsx'
import ButtonTest from '@islands/ButtonTest.tsx'
import ModalContainer from '@islands/ModalContainer.tsx'

export default function Home() {

    return (
        <main class={tw(`absolute top-0 left-0 w-screen h-screen font-lato z-0 bg-gradient-to-r from-orange-300 via-rose-400 to-indigo-400 overflow-hidden`)}>
            <div class={tw(`flex(& col) w-fit gap-40 justify-between mx-32 my-32`)}>

                <div class={tw(`flex(& col) gap-4`)}>
                    <h1 class={tw(`text-5xl font-medium text(white uppercase)`)}> Endgame isn't just friendgame.</h1>
                    <h1 class={tw(`text-xl font-medium text-white`)}> It's fashion too. </h1>
                    <p class={tw(`text-gray-100 w-5/12`)}>
                    "Now that I think about it I could pull off a trap costume now that I lost weight and I'm skinnier than before" - Reminiscent#9909
                    </p>
                </div>

                <div class={tw(`flex(& col) gap-4`)}>
                    <ButtonTest/>
                    <FormTest/>
                </div>
            </div>
            <APILoader/>
            <ModalContainer/>
        </main>
    )
}
