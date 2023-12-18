import { response } from './response/index.ts'

class ErrorResponse extends Error {
  subMessage: string | undefined
  statusCode: number
  constructor(message: string, subMessage: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.subMessage = subMessage
  }
}
class Conflict extends ErrorResponse {
  constructor(message: string, subMessage?: string, statusCode?: number) {
    super(
      message,
      subMessage || response.message.CONFLICT,
      statusCode || response.code.CONFLICT
    )
  }
}
class BadRequest extends ErrorResponse {
  constructor(message: string, subMessage?: string, statusCode?: number) {
    super(
      message,
      subMessage || response.message.BAD_REQUEST,
      statusCode || response.code.BAD_REQUEST
    )
  }
}
class NotFound extends ErrorResponse {
  constructor(message: string, subMessage?: string, statusCode?: number) {
    super(
      message,
      subMessage || response.message.NOT_FOUND,
      statusCode || response.code.NOT_FOUND
    )
  }
}
class Forbidden extends ErrorResponse {
  constructor(message: string, subMessage?: string, statusCode?: number) {
    super(
      message,
      subMessage || response.message.FORBIDDEN,
      statusCode || response.code.FORBIDDEN
    )
  }
}
class Unauthorize extends ErrorResponse {
  constructor(message: string, subMessage?: string, statusCode?: number) {
    super(
      message,
      subMessage || response.message.UNAUTHORIZED,
      statusCode || response.code.UNAUTHORIZED
    )
  }
}

export { Conflict, BadRequest, NotFound, Forbidden, Unauthorize }
