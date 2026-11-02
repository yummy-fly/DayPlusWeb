import { ref } from 'vue'
import { request } from './request'
import { productDetails } from '../data/works'
import { mockCartItems } from '../data/cart'
import type { CartItem, OrderResult, RedeemedVoucher, ShippingInfo } from '../data/cart'
import { saveCreatedOrder } from './order'

const cartStorageKey = 'dayplus-cart'
const voucherStorageKey = 'dayplus-redeemed-vouchers'

export const cartCount = ref(0)

interface StoredCartItem {
  id: string
  color: string
  size: string
  quantity: number
}

function readStoredCart(): StoredCartItem[] {
  const stored: unknown = uni.getStorageSync(cartStorageKey)
  return Array.isArray(stored) ? stored as StoredCartItem[] : []
}

function readVouchers(): RedeemedVoucher[] {
  const stored: unknown = uni.getStorageSync(voucherStorageKey)
  return Array.isArray(stored) ? stored as RedeemedVoucher[] : []
}

function saveCart(items: StoredCartItem[]) {
  uni.setStorageSync(cartStorageKey, items)
  cartCount.value = items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
  uni.$emit('cart-updated')
}

export function getCartCount() {
  return readStoredCart().reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
}

export function addCartItem(product: StoredCartItem) {
  const items = readStoredCart()
  const existing = items.find((item) => item.id === product.id && item.color === product.color && item.size === product.size)
  if (existing) existing.quantity += Math.max(1, Number(product.quantity) || 1)
  else items.push({ ...product, quantity: Math.max(1, Number(product.quantity) || 1) })
  saveCart(items)
  return getCartCount()
}

function buildCartItems(): CartItem[] {
  const storedValue: unknown = uni.getStorageSync(cartStorageKey)
  if (storedValue === undefined || storedValue === null || storedValue === '') return mockCartItems.map((item) => ({ ...item }))
  const stored = readStoredCart()

  return stored.flatMap((item, index) => {
    const product = productDetails[item.id]
    if (!product) return []
    return [{
      id: `${item.id}-${item.color}-${item.size}-${index}`,
      productId: item.id,
      color: item.color,
      size: item.size,
      quantity: Math.max(1, Number(item.quantity) || 1),
      name: product.name,
      image: product.images[0]?.src ?? '',
      price: product.price,
      category: product.category
    }]
  })
}

export function fetchCartItems() {
  return request<CartItem[]>('/cart/items', () => buildCartItems())
}

export function updateCartItem(id: string, quantity: number) {
  return request<CartItem[]>('/cart/items/update', () => {
    const items = buildCartItems().map((item) => item.id === id ? { ...item, quantity } : item)
    saveCart(items.map((item) => ({ id: item.productId, color: item.color, size: item.size, quantity: item.quantity })))
    return items
  }, { method: 'PUT', data: { id, quantity } })
}

export function removeCartItem(id: string) {
  return request<CartItem[]>('/cart/items/remove', () => {
    const items = buildCartItems().filter((item) => item.id !== id)
    saveCart(items.map((item) => ({ id: item.productId, color: item.color, size: item.size, quantity: item.quantity })))
    return items
  }, { method: 'DELETE', data: { id } })
}

export function fetchRedeemedVouchers() {
  return request<RedeemedVoucher[]>('/cart/vouchers', () => {
    const now = Date.now()
    return readVouchers().filter((item) => !item.used && (!item.expiresAt || new Date(item.expiresAt).getTime() > now))
  })
}

export function createOrder(items: CartItem[], voucher: RedeemedVoucher | null, shipping: ShippingInfo) {
  return request<OrderResult>('/orders', () => {
    const amount = Math.max(0, items.reduce((sum, item) => sum + item.price * item.quantity, 0) - (voucher?.value ?? 0))
    const orderNo = `DP${Date.now().toString().slice(-10)}`
    const current = readVouchers()
    if (voucher) {
      const vouchers = current.length ? current : [{ ...voucher }]
      uni.setStorageSync(voucherStorageKey, vouchers.map((item) => item.id === voucher.id ? { ...item, used: true } : item))
    }
    saveCart([])
    saveCreatedOrder(items, amount, shipping, orderNo, voucher?.value ?? 0)
    return { orderNo, amount, createdAt: new Date().toISOString() }
  }, { method: 'POST', data: { items, voucher, shipping } })
}
