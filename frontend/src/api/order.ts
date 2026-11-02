import { request } from './request'
import type { CartItem, ShippingInfo } from '../data/cart'

export type OrderStatus = 'pending-payment' | 'pending-shipment' | 'shipped' | 'completed' | 'refund-requested' | 'refunded' | 'cancelled'

export interface OrderRecord {
  id: string
  orderNo: string
  status: OrderStatus
  items: CartItem[]
  shipping: ShippingInfo
  subtotal: number
  discount: number
  amount: number
  logisticsNo: string
  logisticsStatus: string
  createdAt: string
}

export type OrderFilter = 'all' | 'pending-payment' | 'pending-shipment' | 'shipped' | 'completed' | 'after-sale' | 'refund-requested' | 'refunded'

export const orderTabs: Array<{ key: Exclude<OrderFilter, 'all' | 'after-sale'>; label: string }> = [
  { key: 'pending-payment', label: '待支付' },
  { key: 'pending-shipment', label: '待发货' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' }
]

export const afterSaleStatuses: Array<{ key: 'refund-requested' | 'refunded'; label: string }> = [
  { key: 'refund-requested', label: '退货退款中' },
  { key: 'refunded', label: '已退货退款' }
]

export function orderStatusLabel(status: OrderStatus) {
  if (status === 'cancelled') return '已取消'
  return [...orderTabs, ...afterSaleStatuses].find((item) => item.key === status)?.label ?? ''
}

const orderStorageKey = 'dayplus-orders'

function readOrders(): OrderRecord[] {
  const stored: unknown = uni.getStorageSync(orderStorageKey)
  if (Array.isArray(stored)) {
    const orders = stored as OrderRecord[]
    if (!orders.some((item) => item.status === 'refunded')) {
      const refundedDemo = seedOrders().find((item) => item.status === 'refunded')
      if (refundedDemo) {
        const migrated = [...orders, refundedDemo]
        saveOrders(migrated)
        return migrated
      }
    }
    return orders
  }
  const seeded = seedOrders()
  saveOrders(seeded)
  return seeded
}

function saveOrders(items: OrderRecord[]) {
  uni.setStorageSync(orderStorageKey, items)
}

function demoItems(): CartItem[] {
  return [
    {
      id: 'shirt-01-demo',
      productId: 'shirt-01',
      color: '象牙白',
      size: 'M',
      quantity: 1,
      name: '真丝缎面衬衫',
      image: '/static/shirt.jpg',
      price: 1980,
      category: '成衣'
    },
    {
      id: 'bag-01-demo',
      productId: 'bag-01',
      color: '深黑',
      size: '均码',
      quantity: 1,
      name: '线条感皮革手袋',
      image: '/static/bag.jpg',
      price: 2860,
      category: '手袋'
    }
  ]
}

function seedOrders(): OrderRecord[] {
  const items = demoItems()
  const shipping = { recipient: 'DAY+ 顾客', phone: '138****2680', address: '北京市朝阳区建国门外大街 1 号' }
  return [
    createSeed('DP2026103001', 'pending-payment', items.slice(0, 1), shipping, 1980, 0, '', '等待买家付款', '2026-10-30T09:20:00.000Z'),
    createSeed('DP2026102802', 'pending-shipment', items, shipping, 4840, 200, '', '订单已付款，等待商家发货', '2026-10-28T14:10:00.000Z'),
    createSeed('DP2026102003', 'shipped', items.slice(0, 1), shipping, 1980, 0, 'SF14268020261020', '运输中，预计明日送达', '2026-10-20T11:30:00.000Z'),
    createSeed('DP2026091204', 'completed', items.slice(1), shipping, 2860, 0, 'JD14268020260912', '已签收', '2026-09-12T16:45:00.000Z'),
    createSeed('DP2026090505', 'refund-requested', items.slice(0, 1), shipping, 1980, 0, 'SF14268020260905', '退货退款审核中', '2026-09-05T10:15:00.000Z'),
    createSeed('DP2026081806', 'refunded', items.slice(1), shipping, 2860, 0, 'JD14268020260818', '已完成退货退款，款项已原路退回', '2026-08-18T13:40:00.000Z')
  ]
}

function createSeed(orderNo: string, status: OrderStatus, items: CartItem[], shipping: ShippingInfo, subtotal: number, discount: number, logisticsNo: string, logisticsStatus: string, createdAt: string): OrderRecord {
  return {
    id: orderNo,
    orderNo,
    status,
    items,
    shipping,
    subtotal,
    discount,
    amount: Math.max(0, subtotal - discount),
    logisticsNo,
    logisticsStatus,
    createdAt
  }
}

export function fetchOrders() {
  return request<OrderRecord[]>('/orders/mine', () => {
    return readOrders()
  })
}

export function fetchOrderCounts() {
  return request<Record<OrderStatus, number>>('/orders/counts', () => {
    const orders = readOrders()
    return {
      'pending-payment': orders.filter((item) => item.status === 'pending-payment').length,
      'pending-shipment': orders.filter((item) => item.status === 'pending-shipment').length,
      shipped: orders.filter((item) => item.status === 'shipped').length,
      completed: orders.filter((item) => item.status === 'completed').length,
      'refund-requested': orders.filter((item) => item.status === 'refund-requested').length,
      refunded: orders.filter((item) => item.status === 'refunded').length,
      cancelled: orders.filter((item) => item.status === 'cancelled').length
    }
  })
}

export function payOrder(id: string) {
  return request<{ success: boolean }>('/orders/pay', () => {
    const orders = readOrders()
    if (!orders.some((item) => item.id === id && item.status === 'pending-payment')) return { success: false }
    saveOrders(orders.map((item) => item.id === id ? { ...item, status: 'pending-shipment', logisticsStatus: '模拟支付完成，等待商家发货' } : item))
    return { success: true }
  }, { method: 'POST', data: { id } })
}

export function cancelOrder(id: string) {
  return request<{ success: boolean }>('/orders/cancel', () => {
    const orders = readOrders()
    if (!orders.some((item) => item.id === id && ['pending-payment', 'pending-shipment'].includes(item.status))) return { success: false }
    saveOrders(orders.map((item) => item.id === id ? { ...item, status: 'cancelled', logisticsStatus: item.status === 'pending-shipment' ? '订单已取消，模拟退款已退回原支付账户' : '订单已取消，未产生支付' } : item))
    return { success: true }
  }, { method: 'POST', data: { id } })
}

export function requestOrderRefund(id: string) {
  return request<{ success: boolean }>('/orders/refund', () => {
    const orders = readOrders()
    if (!orders.some((item) => item.id === id && ['shipped', 'completed'].includes(item.status))) return { success: false }
    saveOrders(orders.map((item) => item.id === id ? { ...item, status: 'refund-requested', logisticsStatus: '退货退款申请已提交' } : item))
    return { success: true }
  }, { method: 'POST', data: { id } })
}

export function saveCreatedOrder(items: CartItem[], amount: number, shipping: ShippingInfo, orderNo: string, discount = 0) {
  const order: OrderRecord = {
    id: orderNo,
    orderNo,
    status: 'pending-shipment',
    items: items.map((item) => ({ ...item })),
    shipping,
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    discount: Math.min(discount, items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    amount,
    logisticsNo: '',
    logisticsStatus: '模拟支付完成，等待商家发货',
    createdAt: new Date().toISOString()
  }
  saveOrders([order, ...readOrders()])
}
