export type MemberLevel = '普卡' | '银卡' | '金卡' | '白金卡'

export interface MemberProfile {
  name: string
  avatar: string
  memberNo: string
  phone: string
  registeredAt: string
  level: MemberLevel
  points: number
  balance: number
  nextLevel: MemberLevel | null
  nextLevelPoints: number | null
}

export interface ProfileSummary {
  name: string
  avatar: string
  memberLabel: string
  memberLevel: MemberLevel
  points: number
  orderCounts: { key: string; label: string; count: number }[]
  modules: { id: string; title: string; subtitle: string }[]
}

export type DiagnosisReportType = '色彩诊断' | '形象诊断' | '专属形象设计'

export interface DiagnosisReport {
  id: string
  type: DiagnosisReportType
  title: string
  description: string
  issuedAt: string
  viewed: boolean
  pdfUrl: string
}

export const memberLevels: { level: MemberLevel; requiredPoints: number }[] = [
  { level: '普卡', requiredPoints: 0 },
  { level: '银卡', requiredPoints: 3000 },
  { level: '金卡', requiredPoints: 8000 },
  { level: '白金卡', requiredPoints: 15000 }
]

export const memberProfile: MemberProfile = {
  name: 'DAY+ 顾客',
  avatar: 'https://i.pravatar.cc/200?img=47',
  memberNo: 'DAY20261028001',
  phone: '138****2680',
  registeredAt: '2026年10月28日',
  level: '普卡',
  points: 2680,
  balance: 500,
  nextLevel: '银卡',
  nextLevelPoints: 3000
}

export const profileSummary: ProfileSummary = {
  name: memberProfile.name,
  avatar: memberProfile.avatar,
  memberLabel: 'DAY+ STYLE MEMBER',
  memberLevel: memberProfile.level,
  points: memberProfile.points,
  orderCounts: [
    { key: 'pending-payment', label: '待支付', count: 0 },
    { key: 'pending-shipment', label: '待发货', count: 0 },
    { key: 'shipped', label: '已发货', count: 0 },
    { key: 'completed', label: '已完成', count: 0 },
    { key: 'after-sale', label: '售后', count: 0 }
  ],
  modules: [
    { id: 'favorites', title: '我的收藏', subtitle: '珍藏喜欢的单品与造型' },
    { id: 'points', title: '积分明细', subtitle: '查看积分获取与使用记录' },
    { id: 'coupons', title: '券包', subtitle: '查看可用优惠券' },
    { id: 'archive', title: '消费档案', subtitle: '记录专属消费与风格偏好' },
    { id: 'appointments', title: '我的预约', subtitle: '查看预约服务与进度' },
    { id: 'addresses', title: '我的地址', subtitle: '管理收货地址与配送信息' }
  ]
}

export const profileModuleTitles: Record<string, string> = {
  profile: '个人信息',
  orders: '我的订单',
  favorites: '我的收藏',
  points: '积分明细',
  coupons: '券包',
  archive: '消费档案',
  appointments: '我的预约'
}
