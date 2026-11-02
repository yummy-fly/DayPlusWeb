import { request } from './request'
import { profileSummary } from '../data/profile'
import { memberLevels, memberProfile } from '../data/profile'
import type { DiagnosisReport, MemberProfile, ProfileSummary } from '../data/profile'
import { getPointsBalance } from './points'
import { afterSaleStatuses, fetchOrderCounts, orderTabs } from './order'

export function fetchProfileSummary() {
  return request<ProfileSummary>('/user/profile/summary', async () => {
    const counts = await fetchOrderCounts()
    return {
      ...profileSummary,
      avatar: memberProfile.avatar,
      memberLevel: (await fetchMemberProfile()).level,
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

const diagnosisReports: DiagnosisReport[] = [
  {
    id: 'diagnosis-color-20261012',
    type: '色彩诊断',
    title: '个人色彩诊断报告',
    description: '基于肤色、发色与日常着装偏好的专属色彩建议。',
    issuedAt: '2026-10-12',
    viewed: true,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'diagnosis-image-20261020',
    type: '形象诊断',
    title: '个人形象诊断报告',
    description: '从风格、版型与搭配比例出发，建立更适合您的形象方向。',
    issuedAt: '2026-10-20',
    viewed: false,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'diagnosis-design-20261028',
    type: '专属形象设计',
    title: '年度专属形象设计报告',
    description: 'VIP / VIC 年度礼遇，包含专属衣橱规划与季度造型建议。',
    issuedAt: '2026-10-28',
    viewed: false,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
]

export function fetchProfileModule(moduleId: string) {
  return request<{ id: string; title: string }>('/user/profile/module', () => ({
    id: moduleId,
    title: profileSummary.modules.find((item) => item.id === moduleId)?.title ?? '个人信息'
  }))
}

export function fetchDiagnosisReports() {
  return request<DiagnosisReport[]>('/user/profile/diagnosis-reports', () => diagnosisReports.map((report) => ({ ...report })))
}

export function markDiagnosisReportViewed(id: string) {
  return request<DiagnosisReport>('/user/profile/diagnosis-reports/view', () => {
    const report = diagnosisReports.find((item) => item.id === id)
    if (!report) throw new Error('报告不存在')
    report.viewed = true
    return { ...report }
  }, { method: 'POST', data: { id } })
}

export function fetchMemberProfile() {
  return request<MemberProfile>('/user/member/profile', () => {
    const points = getPointsBalance()
    const current = [...memberLevels].reverse().find((item) => points >= item.requiredPoints) ?? memberLevels[0]
    const next = memberLevels.find((item) => item.requiredPoints > points) ?? null
    memberProfile.points = points
    memberProfile.level = current.level
    memberProfile.nextLevel = next?.level ?? null
    memberProfile.nextLevelPoints = next?.requiredPoints ?? null
    const storedBalance = uni.getStorageSync('dayplus-member-balance')
    if (typeof storedBalance === 'number') memberProfile.balance = storedBalance
    return { ...memberProfile }
  })
}

export function rechargeMemberCard(amount: number) {
  return request<{ balance: number; amount: number }>('/user/member/recharge', () => {
    const storedBalance = uni.getStorageSync('dayplus-member-balance')
    memberProfile.balance = (typeof storedBalance === 'number' ? storedBalance : memberProfile.balance) + amount
    uni.setStorageSync('dayplus-member-balance', memberProfile.balance)
    return { balance: memberProfile.balance, amount }
  }, { method: 'POST', data: { amount } })
}
