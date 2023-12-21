import crypto from 'node:crypto'
const pickKeysInObject = <T extends object, K extends keyof T>({
  object,
  keys
}: {
  object: T
  keys: K[]
}) =>
  keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key]
    }
    return result
  }, {} as Pick<T, K>)

const generateKey = () => crypto.randomBytes(64).toString('hex')

const dateStringToNumber = (dateString: string) => {
  const dateParts = dateString.split('-')
  const day = parseInt(dateParts[2], 10)
  const month = parseInt(dateParts[1], 10)
  const year = parseInt(dateParts[0], 10)

  const date = new Date(Date.UTC(year, month - 1, day))

  const utcPlus7Offset = 7 * 60 * 60 * 1000

  const utcPlus7Timestamp = date.getTime() + utcPlus7Offset

  return utcPlus7Timestamp
}

export { pickKeysInObject, generateKey, dateStringToNumber }
