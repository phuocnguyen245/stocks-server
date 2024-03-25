import { FilterQuery, Types } from 'mongoose'
import { Payments } from '../../models/payment.model.ts'
import type { PagePagination, Payments as PaymentsType } from '../../types/types.js'

class PaymentService {
  static getAllPayments = async (
    pagination: PagePagination<PaymentsType>,
    extraFilter?: FilterQuery<PaymentsType>
  ) => {
    const { page, size, sortDirection, sortBy, userId } = pagination
    const sortPage = page || 0
    const sortSize = size || 10
    const filter: FilterQuery<PaymentsType> = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
      ...extraFilter
    }

    const data = await Payments.find(filter)
      .sort({
        [`${sortBy || 'createdAt'}`]: sortDirection ?? 'desc'
      })
      .limit(sortSize)
      .skip(sortPage * sortSize)
      .lean()

    const total = await Payments.aggregate([
      {
        $match: { isDeleted: false, userId: new Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalTopUp: {
            $sum: {
              $cond: [{ $eq: ['$type', 0] }, { $multiply: ['$balance', 1] }, 0]
            }
          },
          totalWithdraw: {
            $sum: {
              $cond: [{ $eq: ['$type', 1] }, { $multiply: ['$balance', 1] }, 0]
            }
          }
        }
      }
    ])

    return { data, total }
  }

  static createPayment = async (body: PaymentsType, userId: string) => {
    const { name, balance, type, date } = body
    const payment = (
      await Payments.create({ name, balance, type, date, userId: new Types.ObjectId(userId) })
    ).toObject()
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

  static getBalance = async (userId: string) => {
    const result = await Payments.aggregate([
      {
        $match: { isDeleted: false, userId: new Types.ObjectId(userId) }
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

    return result[0]?.totalBalance || 0
  }
}
export default PaymentService
