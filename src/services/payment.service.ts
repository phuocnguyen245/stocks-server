import { FilterQuery, Types } from 'mongoose'
import { Payments } from '../models/payment.model.ts'
import type { PagePagination, Payments as PaymentsType } from '../types/types.js'

class PaymentService {
  static getAllPayments = async (
    pagination: PagePagination<PaymentsType>,
    extraFilter?: FilterQuery<PaymentsType>
  ) => {
    const { page, size, sort, orderBy } = pagination

    const filter: FilterQuery<PaymentsType> = {
      isDeleted: false,
      ...extraFilter
    }

    const data = await Payments.find(filter)
      .limit(size ?? 10)
      .skip(((page ?? 1) - 1) * (size ?? 10))
      .sort({
        [`${sort ?? 'createAt'}`]: orderBy ?? 'asc'
      })
      .lean()
    return data
  }
  static createPayment = async (body: PaymentsType) => {
    const { name, balance, type } = body
    const payment = (await Payments.create({ name, balance, type })).toObject()
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
    return await Payments.findByIdAndUpdate(new Types.ObjectId(id), { isDelete: true })
  }
}
export default PaymentService
