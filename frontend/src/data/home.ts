import { workCollections } from './works'

/**
 * 首页模拟数据（本地模式使用）
 */

export interface HeroSlide {
  image: string
  code: string
  eyebrow: string
  title: string
  action: string
}

export interface Look {
  id?: string
  image: string
  label: string
  title: string
}

export interface Product {
  id: string
  name: string
  detail: string
  price: string
  image: string
}

export const heroSlides: HeroSlide[] = [
  { image: '/static/hero.jpg', code: '01 / 03', eyebrow: 'DAY+ / AUTUMN WINTER 2026', title: '静谧之中，\n自有锋芒。', action: '探索当季系列' },
  { image: '/static/collection.jpg', code: '02 / 03', eyebrow: 'DAY+ / THE NEW FORM', title: '在轮廓之外，\n寻找自由。', action: '查看本季作品' },
  { image: '/static/appointment.jpg', code: '03 / 03', eyebrow: 'DAY+ / PRIVATE SERVICE', title: '一场专属的，\n风格提案。', action: '预约到店服务' }
]

export const looks: Look[] = [
  ...workCollections['2026秋冬系列'].map((item) => ({
    id: `2026秋冬系列:${item.code}`, image: item.image, label: item.code, title: item.name
  })),
  { image: '', label: '', title: '更多搭配' }
]

export const products: Product[] = [
  { id: 'coat-01', name: '廓形羊毛外套', detail: '精纺羊毛 · 暖灰', price: '¥ 3,680', image: '/static/coat.jpg' },
  { id: 'shirt-01', name: '真丝缎面衬衫', detail: '桑蚕丝 · 象牙白', price: '¥ 1,980', image: '/static/shirt.jpg' },
  { id: 'bag-01', name: '线条感皮革手袋', detail: '小牛皮 · 深黑', price: '¥ 2,860', image: '/static/bag.jpg' },
  { id: 'dress-01', name: '垂坠针织长裙', detail: '羊毛混纺 · 墨黑', price: '¥ 2,280', image: '/static/collection.jpg' },
  { id: 'jacket-01', name: '短款立体夹克', detail: '再生尼龙 · 石灰', price: '¥ 2,980', image: '/static/hero.jpg' },
  { id: 'scarf-01', name: '轻盈羊绒围巾', detail: '纯羊绒 · 暖白', price: '¥ 980', image: '/static/appointment.jpg' }
]

/** 用户积分余额（模拟） */
export const points = 2680
