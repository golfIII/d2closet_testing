/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from '$preact'
import { useEffect, useState } from '$preact/hooks'

import { tw } from '@twind'

export enum ModalType {
    Error   = 'red-500',
    Info    = 'blue-400',
    Success =  'green-500'
}

const modalTypeToName = {
    [ModalType.Error]: 'Error',
    [ModalType.Info]: 'Info',
    [ModalType.Success]: 'Success',
}

interface ModalProps {
    type: ModalType,
    text: string
}

export function showModal(info: ModalProps) {
    const event = new CustomEvent('showModal', { detail: info })
    document.dispatchEvent(event)
}

function hideModal() {
    const event = new Event('hideModal')
    document.dispatchEvent(event)
}

function Modal(props: ModalProps) {
    return (
        <>
            <div class={tw(`flex(& col) `)}>
                <div class={tw(`flex justify-center items-center bg-${props.type} p-6 rounded-t-md w-56 h-10 text-white grow`)}>
                    { modalTypeToName[props.type] }
                </div>
                <div class={tw(`flex justify-center items-center bg-gray-800 p-6 rounded-b-md w-56 h-40 text-white grow`)}>
                    { props.text }
                </div>
            </div>
        </>
    )
}

export default function ModalContainer() {
    const [showModal, setShow] = useState(false)
    const [modalInfo, setModalInfo] = useState<ModalProps>({
        type: ModalType.Info,
        text: 'Default'
    })

    useEffect(() => {
        // Bind the modal event listeners
        document.addEventListener('showModal', ((e: CustomEvent<ModalProps>) => {
            e.preventDefault()
            setShow(true)
            setModalInfo(e.detail)
        }) as EventListener)

        document.addEventListener('hideModal', ((e: Event) => {
            e.preventDefault()
            setShow(false)
        }) as EventListener)
    }, [])

    return (
        <>
            <div 
                class={tw(`${showModal ? 'block' : 'hidden'} bg-black opacity-50 absolute top-0 left-0 w-screen h-screen z-30`)}
                onClick={hideModal}
            > </div>
            <div 
                class={tw(`${showModal ? 'flex' : 'hidden'} absolute top-0 left-0 justify-center items-center w-screen h-screen z-40`)}
                onClick={hideModal}
            >
                {showModal && <Modal {...modalInfo} />}
            </div>
        </>
    )
}

