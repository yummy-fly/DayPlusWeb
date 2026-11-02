export type RewardType = '代金券' | '咖啡兑换券'

export interface RewardItem {
  id: string
  type: RewardType
  name: string
  value: string
  points: number
  description: string
  validity: string
}

export const rewardItems: RewardItem[] = [
  { id: 'voucher-50', type: '代金券', name: 'DAY+ 50元代金券', value: '¥ 50', points: 500, description: '可用于 DAY+ 门店及线上商城', validity: '兑换后 30 天内有效' },
  { id: 'coffee-01', type: '咖啡兑换券', name: '手冲咖啡兑换券', value: '1 杯', points: 300, description: 'DAY+ 门店限定饮品', validity: '兑换后 30 天内有效' },
  { id: 'voucher-100', type: '代金券', name: 'DAY+ 100元代金券', value: '¥ 100', points: 900, description: '可用于 DAY+ 门店及线上商城', validity: '兑换后 30 天内有效' },
  { id: 'coffee-02', type: '咖啡兑换券', name: '燕麦拿铁兑换券', value: '1 杯', points: 420, description: 'DAY+ 门店限定饮品', validity: '兑换后 30 天内有效' }
]
