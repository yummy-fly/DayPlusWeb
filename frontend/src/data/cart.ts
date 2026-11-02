import type { ProductDetail } from './works'

export interface CartItem {
  id: string
  productId: string
  color: string
  size: string
  quantity: number
  name: string
  image: string
  price: number
  category: ProductDetail['category']
}

export interface RedeemedVoucher {
  id: string
  name: string
  value: number
  used: boolean
  type?: '代金券' | '咖啡兑换券'
  redeemedAt?: string
  expiresAt?: string
}

export interface ShippingInfo {
  recipient: string
  phone: string
  address: string
}

export interface OrderResult {
  orderNo: string
  amount: number
  createdAt: string
}

export const mockCartItems: CartItem[] = [
  {
    id: 'shirt-01-象牙白-M',
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
    id: 'bag-01-深黑-均码',
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
