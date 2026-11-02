export interface ProfileSummary {
  name: string
  memberLabel: string
  points: number
  orderCounts: { key: string; label: string; count: number }[]
  modules: { id: string; title: string; subtitle: string }[]
}

export const profileSummary: ProfileSummary = {
  name: 'DAY+ 顾客',
  memberLabel: 'DAY+ STYLE MEMBER',
  points: 2680,
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
