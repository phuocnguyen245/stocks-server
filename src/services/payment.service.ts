import { FilterQuery, Types } from 'mongoose'
import { Payments } from '../models/payment.model.ts'
import type { PagePagination, Payments as PaymentsType } from '../types/types.js'

class PaymentService {
  static getAllPayments = async (
    pagination: PagePagination<PaymentsType>,
    extraFilter?: FilterQuery<PaymentsType>
  ) => {
    const { page, size, sort, orderBy } = pagination
    const sortPage = page || 0
    const sortSize = size || 10
    const filter: FilterQuery<PaymentsType> = {
      isDeleted: false,
      ...extraFilter
    }

    const data = await Payments.find(filter)
      .sort({
        [`${sort ?? 'createdAt'}`]: orderBy ?? 'desc'
      })
      .limit(sortSize)
      .skip(sortPage * sortSize)
      .lean()
    return data
  }

  static createPayment = async (body: PaymentsType) => {
    const { name, balance, type, date } = body
    const payment = (await Payments.create({ name, balance, type, date })).toObject()
    return payment
  }

  static getPaymentById = async (id: string) => {
    return (await Payments.findById(new Types.ObjectId(id)))?.toObject()
  }

  static updatePayment = async (id: string, body: PaymentsType) => {
    return (
      await Payments.findByIdAndUpdate(new Types.ObjectId(id), body, { isNew: true })
    )?.toObject()
  }

  static removePayment = async (id: string) => {
    return await Payments.findByIdAndUpdate(new Types.ObjectId(id), { isDeleted: true })
  }

  static getBalance = async () => {
    const result = await Payments.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalBalance: {
            $sum: {
              $cond: [{ $eq: ['$type', 1] }, { $multiply: ['$balance', -1] }, '$balance']
            }
          }
        }
      }
    ])

    return result[0]?.totalBalance || 0 // Return the ca
  }
}
export default PaymentService
