// Utilities for converting raw buffers into strings and numbers

export function ToString(buffer: Int8Array): string
{
    let returnString = ''
    for(const byte of buffer) {
        if(byte === 0)
            return returnString

        returnString += String.fromCharCode(byte)
    }

    return returnString
}

export enum Int {
    U8 = "U8",
    S8 = "S8",
    U16 = "U16",
    S16 = "S16",
    U32 = "U32",
    S32 = "S32"
}

export enum Float {
    F32 = "F32", // float
    F64 = "F64"  // double
}

export function ToInt(type: Int, buffer: Int8Array, normalize: boolean = false): number
{
    const intMaxes = {
        "U8": 255, 
        "S8": 127, 
        "U16": 65535, 
        "S16": 32767,
        "U32": 4294967295, 
        "S32": 2147483647 
    }

    const view = new DataView(buffer.buffer)

    let val

    switch(type) {
        case Int.U8: case Int.S8: {
            val = (type === Int.U8) ? view.getUint8(0) : view.getInt8(0)
            break
        }
        case Int.U16: case Int.S16: {
            val = (type === Int.U16) ? view.getUint16(0, true) : view.getInt16(0, true)
            break
        }
        case Int.U32: case Int.S32: {
            val = (type === Int.U32) ? view.getUint32(0, true) : view.getInt32(0, true)
            break
        }
    }

    return (normalize) ? (val / intMaxes[type]) : val
}

export function ToFloat(type: Float, buffer: Int8Array): number
{
    const view = new DataView(buffer.buffer)

    switch(type) {
        case Float.F32: return view.getFloat32(0, true)
        case Float.F64: return view.getFloat64(0, true)
    }
}

// Returns the size of a datatype, which is either an int or a float.
export function GetDataTypeSize(type: Int | Float)
{
    switch(type) {
        case Int.U8: case Int.S8: return 1
        case Int.U16: case Int.S16: return 2
        case Int.U32: case Int.S32: case Float.F32: return 4
        case Float.F64: return 8
    }
}