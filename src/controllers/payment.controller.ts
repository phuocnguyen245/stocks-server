import { Request, Response } from 'express'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { CREATED, OK, UPDATED } from '../core/success.response.ts'
import PaymentService from '../services/v1Mongoose/payment.service.ts'
import { PagePagination, Payments, RequestWithUser } from '../types/types.js'

const message = {
  NOT_FOUND: 'Payment not found',
  GET_ALL: 'Get all payments successfully',
  GET_BY_ID: 'Get payment by id successfully',
  CREATED: 'Created payment successfully',
  UPDATED: 'Updated payment successfully',
  REMOVE: 'Remove payment successfully',
  MISSING_ID: 'Id is required'
}

class PaymentController {
  static getAll = async (req: RequestWithUser, res: Response) => {
    const { page, size, sortBy, sortDirection } = req.query as unknown as PagePagination<Payments>
    const { id: userId } = req
    const payments = await PaymentService.getAllPayments({
      page,
      size,
      sortBy,
      sortDirection,
      userId
    })

    return new OK({
      data: {
        data: payments.data,
        totalItems: payments.data.length,
        total: payments.total,
        page,
        size
      },
      message: message.GET_ALL
    }).send(res)
  }

  static getById = async (req: Request, res: Response) => {
    const { id } = req.params
    const foundPayment = await PaymentService.getPaymentById(id)
    if (!foundPayment) {
      throw new NotFound(message.NOT_FOUND)
    }
    return new OK({ data: foundPayment, message: message.GET_BY_ID }).send(res)
  }

  static create = async (req: RequestWithUser, res: Response) => {
    const { body, id: userId } = req
    const createdPayment = await PaymentService.createPayment(body, userId)
    return new CREATED({ data: createdPayment, message: message.CREATED }).send(res)
  }

  static update = async (req: Request, res: Response) => {
    const body = req.body
    const { id } = req.params
    if (!id) {
      throw new BadRequest(message.MISSING_ID)
    }
    const createdPayment = await PaymentService.updatePayment(id, body)
    return new UPDATED({ data: createdPayment, message: message.CREATED }).send(res)
  }

  static remove = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) {
      throw new BadRequest(message.MISSING_ID)
    }
    await PaymentService.removePayment(id)
    return new UPDATED({ message: message.CREATED }).send(res)
  }
}

export default PaymentController
