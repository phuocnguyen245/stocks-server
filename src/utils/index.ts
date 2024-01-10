import moment from 'moment'
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
  const date = new Date(dateString)
  const timestamp = date.getTime()

  const offset = 7 * 60 * 60 * 1000

  const utcPlus7Timestamp = timestamp + offset
  return utcPlus7Timestamp
}

const convertToDecimal = (value: string | number, decimal = 2): number => {
  return Number(Number(value).toFixed(2))
}

const countDays = (startDate: string, endDate = moment().toISOString()): number => {
  let start = moment(startDate).utcOffset(420).startOf('day')
  const end = moment(endDate).utcOffset(420).startOf('day')
  let diffDays = 0

  const isAfternoon = Number(moment(endDate).format('HH')) >= 12 ? 0.5 : 0

  if (start.isSame(end)) {
    return isAfternoon
  }

  while (start.isBefore(end)) {
    if (start.day() !== 0 && start.day() !== 6) {
      diffDays++
    }
    start = start.add(1, 'days')
  }

  return diffDays + isAfternoon
}

export { pickKeysInObject, generateKey, dateStringToNumber, convertToDecimal, countDays }
