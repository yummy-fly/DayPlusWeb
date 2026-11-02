import { request } from './request'
import { rewardItems } from '../data/points'
import type { RewardItem } from '../data/points'
import type { RedeemedVoucher } from '../data/cart'

export interface PointRecord {
  id: string
  type: 'earn' | 'redeem'
  amount: number
  title: string
  description: string
  createdAt: string
}

const pointsStorageKey = 'dayplus-points'
const recordsStorageKey = 'dayplus-point-records'
const initialPoints = 2680

function readBalance() {
  const stored = uni.getStorageSync(pointsStorageKey)
  return stored === '' || stored === null || stored === undefined ? initialPoints : Number(stored)
}

function readRecords(): PointRecord[] {
  const stored: unknown = uni.getStorageSync(recordsStorageKey)
  if (Array.isArray(stored)) return stored as PointRecord[]
  return [
    { id: 'point-demo-1', type: 'earn', amount: 200, title: '消费返积分', description: '订单 DP2026101801 完成，按消费金额返还', createdAt: '2026-10-18T10:30:00.000Z' },
    { id: 'point-demo-2', type: 'redeem', amount: 300, title: '积分兑换', description: '手冲咖啡兑换券', createdAt: '2026-10-12T15:20:00.000Z' }
  ]
}

function saveBalance(value: number) {
  uni.setStorageSync(pointsStorageKey, Math.max(0, value))
  uni.$emit('points-updated')
}

function addRecord(record: Omit<PointRecord, 'id' | 'createdAt'>) {
  const records = readRecords()
  records.unshift({ ...record, id: `point-${Date.now()}-${records.length}`, createdAt: new Date().toISOString() })
  uni.setStorageSync(recordsStorageKey, records)
}

export function getPointsBalance() {
  return readBalance()
}

export function fetchPointRecords() {
  return request<PointRecord[]>('/user/points/records', () => readRecords())
}

export function recordPointsEarned(amount: number, orderNo: string) {
  const points = Math.floor(Math.max(0, amount) / 10)
  if (!points) return
  saveBalance(readBalance() + points)
  addRecord({ type: 'earn', amount: points, title: '消费返积分', description: `订单 ${orderNo} 完成，按消费金额返还` })
}

export function fetchPointsBalance() {
  return request<{ points: number }>('/user/points', () => ({ points: readBalance() }))
}

export function fetchRewardItems() {
  return request<RewardItem[]>('/points/rewards', () => rewardItems)
}

export function exchangeReward(id: string, points: number) {
  return request<{ success: boolean; points: number }>('/points/exchange', () => {
    const current = readBalance()
    if (current < points) return { success: false, points: current }
    const reward = rewardItems.find((item) => item.id === id)
    const next = current - points
    saveBalance(next)
    addRecord({
      type: 'redeem',
      amount: points,
      title: '积分兑换',
      description: reward?.name ?? '积分商城礼遇'
    })
    if (reward) {
      const key = 'dayplus-redeemed-vouchers'
      const stored: unknown = uni.getStorageSync(key)
      const vouchers = Array.isArray(stored) ? stored as RedeemedVoucher[] : []
      const redeemedAt = new Date()
      const expiresAt = new Date(redeemedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      vouchers.push({
        id: `${id}-${Date.now()}`,
        name: reward.name,
        value: reward.type === '代金券' ? Number(reward.value.replace(/[^0-9.]/g, '')) : 0,
        used: false,
        type: reward.type,
        redeemedAt: redeemedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      })
      uni.setStorageSync(key, vouchers)
    }
    return { success: true, points: next }
  }, { method: 'POST', data: { id, points } })
}
