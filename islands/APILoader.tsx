/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { useEffect, useState } from '$preact/hooks'

import { tw } from '@twind'

// Credit to https://samherbert.net/svg-loaders/
function Loading() {
    return (
        <div class={tw(`flex flex-col items-center`)}>
            <div class={tw(`flex gap-4`)}>
                <img 
                    src='/loading-triangle.svg'
                    class={tw(`inline-block h-20 fill-white`)}
                />
            </div>
            <p class={tw(`text-white`)}>Loading manifest content...</p>
        </div>
    )
}

export default function APILoader() {

    const [isResolved, setResolveState] = useState(false)

    useEffect(() => {
        // On startup, initialize the database
        fetch(`${window.location.origin}/api/init`).then((resp) => {
            resp.json().then((json) => {
                console.log(json)
                setResolveState(true)
            })
        })

        return () => {
            fetch(`${window.location.origin}/api/close`)
        }
    }, [])

    return (
        <>
            { !isResolved && 
                <div class={tw(`bg-gray-500 absolute inset-0 flex justify-center items-center w-screen h-screen z-50`)}>
                    <Loading/>
                </div> 
            }
        </>
    )
}