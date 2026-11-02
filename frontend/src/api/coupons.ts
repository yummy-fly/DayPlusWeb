import { request } from './request'
import type { RedeemedVoucher } from '../data/cart'

const voucherStorageKey = 'dayplus-redeemed-vouchers'

export type CouponStatus = 'unused' | 'used' | 'expired'

export interface CouponItem extends RedeemedVoucher {
  type: '代金券' | '咖啡兑换券'
  redeemedAt: string
  expiresAt: string
  status: CouponStatus
}

function readCoupons(): RedeemedVoucher[] {
  const stored: unknown = uni.getStorageSync(voucherStorageKey)
  return Array.isArray(stored) ? stored as RedeemedVoucher[] : []
}

function normalizeCoupon(item: RedeemedVoucher): CouponItem {
  const redeemedAt = item.redeemedAt ?? new Date().toISOString()
  const expiresAt = item.expiresAt ?? new Date(new Date(redeemedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const status: CouponStatus = item.used ? 'used' : new Date(expiresAt).getTime() <= Date.now() ? 'expired' : 'unused'
  return {
    ...item,
    type: item.type ?? '代金券',
    redeemedAt,
    expiresAt,
    status
  }
}

export function fetchCouponWallet() {
  return request<CouponItem[]>('/user/coupons', () => {
    const coupons = readCoupons().map(normalizeCoupon)
    uni.setStorageSync(voucherStorageKey, coupons.map(({ status: _status, ...item }) => item))
    return coupons
  })
}
