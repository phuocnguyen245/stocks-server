declare class ErrorResponse extends Error {
    subMessage: string | undefined;
    statusCode: number;
    constructor(message: string, subMessage: string, statusCode: number);
}
declare class Conflict extends ErrorResponse {
    constructor(message: string, subMessage?: string, statusCode?: number);
}
declare class BadRequest extends ErrorResponse {
    constructor(message: string, subMessage?: string, statusCode?: number);
}
declare class NotFound extends ErrorResponse {
    constructor(message: string, subMessage?: string, statusCode?: number);
}
declare class Forbidden extends ErrorResponse {
    constructor(message: string, subMessage?: string, statusCode?: number);
}
declare class Unauthorize extends ErrorResponse {
    constructor(message: string, subMessage?: string, statusCode?: number);
}
export { Conflict, BadRequest, NotFound, Forbidden, Unauthorize };
