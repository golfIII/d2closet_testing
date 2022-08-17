export const D2APIRoot = 'https://www.bungie.net/Platform'
export const D2Root = 'https://bungie.net'

export interface D2APIResponse<T = any> {
    Response: T,
    ErrorCode: number,
    ThrottleSeconds: number,
    ErrorStatus: string,
    Message: string,
    MessageData: Record<string, string>
    DetailedErrorTrace: string
}