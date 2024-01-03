import { Request, Response } from 'express'
import PaymentService from '../services/payment.service.ts'
import { CREATED, OK, UPDATED } from '../core/success.response.ts'
import { OrderBy, PagePagination, Payments } from '../types/types.js'
import { BadRequest, NotFound } from '../core/error.response.ts'

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
  static getAll = async (req: Request, res: Response) => {
    const { page, size, sort, orderBy } = req.query as unknown as PagePagination<Payments>

    const payments = await PaymentService.getAllPayments({
      page,
      size,
      sort,
      orderBy
    })

    return new OK({
      data: {
        data: payments,
        totalItems: payments.length,
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

  static create = async (req: Request, res: Response) => {
    const body = req.body
    const createdPayment = await PaymentService.createPayment(body)
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
