import { request } from './request'
import { profileSummary } from '../data/profile'
import type { ProfileSummary } from '../data/profile'
import { getPointsBalance } from './points'
import { afterSaleStatuses, fetchOrderCounts, orderTabs } from './order'

export function fetchProfileSummary() {
  return request<ProfileSummary>('/user/profile/summary', async () => {
    const counts = await fetchOrderCounts()
    return {
      ...profileSummary,
      points: getPointsBalance(),
      orderCounts: [
        ...orderTabs.map((tab) => ({ ...tab, count: counts[tab.key] })),
        {
          key: 'after-sale',
          label: '售后',
          count: afterSaleStatuses.reduce((sum, status) => sum + counts[status.key], 0)
        }
      ],
      modules: profileSummary.modules.filter((item) => item.id !== 'points')
    }
  })
}

export interface ConsumptionRecordItem {
  name: string
  size: string
  color: string
  quantity: number
  price: number
}

export interface ConsumptionRecord {
  id: string
  purchasedAt: string
  store: string
  amount: number
  items: ConsumptionRecordItem[]
}

export function fetchConsumptionRecords() {
  return request<ConsumptionRecord[]>('/user/profile/consumption-records', () => [
    {
      id: 'store-20261018-01',
      purchasedAt: '2026-10-18T15:20:00+08:00',
      store: 'DAY+ 北京国贸店',
      amount: 4840,
      items: [
        { name: '真丝缎面衬衫', size: 'M', color: '象牙白', quantity: 1, price: 1980 },
        { name: '线条感皮革手袋', size: '均码', color: '深黑', quantity: 1, price: 2860 }
      ]
    },
    {
      id: 'store-20260906-02',
      purchasedAt: '2026-09-06T12:45:00+08:00',
      store: 'DAY+ 上海静安店',
      amount: 3680,
      items: [
        { name: '廓形羊毛外套', size: 'S', color: '深灰', quantity: 1, price: 3680 }
      ]
    },
    {
      id: 'store-20260822-03',
      purchasedAt: '2026-08-22T16:10:00+08:00',
      store: 'DAY+ 杭州湖滨店',
      amount: 2960,
      items: [
        { name: '垂坠针织长裙', size: 'M', color: '燕麦色', quantity: 1, price: 1680 },
        { name: '软檐渔夫帽', size: '均码', color: '暖棕色', quantity: 1, price: 1280 }
      ]
    }
  ])
}

export function fetchProfileModule(moduleId: string) {
  return request<{ id: string; title: string }>('/user/profile/module', () => ({
    id: moduleId,
    title: profileSummary.modules.find((item) => item.id === moduleId)?.title ?? '个人信息'
  }))
}
