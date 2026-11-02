import { request } from './request'
import { addCartItem } from './cart'
import { lookDetails, productDetails, workCollections } from '../data/works'
import type { LookDetail, ProductDetail, WorkCollections } from '../data/works'

/** 作品分类列表 */
export function fetchWorkCollections() {
  return request<WorkCollections>('/works/collections', () => workCollections)
}

const favoriteStorageKey = 'dayplus-product-favorites'
const lookFavoriteStorageKey = 'dayplus-look-favorites'

function readFavorites(key = favoriteStorageKey): string[] {
  const stored: unknown = uni.getStorageSync(key)
  return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
}

export function isProductFavorite(id: string) {
  return readFavorites().includes(id)
}

export function isLookFavorite(id: string) {
  return readFavorites(lookFavoriteStorageKey).includes(id)
}

export interface FavoriteLook {
  id: string
  category: '造型系列'
  series: string
  code: string
  name: string
  image: string
}

export interface FavoriteProduct {
  id: string
  category: ProductDetail['category']
  code: string
  name: string
  image: string
  price: number
}

export interface FavoriteCollections {
  looks: FavoriteLook[]
  products: FavoriteProduct[]
}

export function fetchFavoriteCollections() {
  return request<FavoriteCollections>('/user/favorites', () => {
    const looks = readFavorites(lookFavoriteStorageKey).flatMap((id) => {
      const detail = findDetail(lookDetails, id)
      if (!detail) return []
      return [{ id, category: '造型系列' as const, series: detail.series, code: detail.code, name: detail.name, image: detail.images[0]?.src ?? '' }]
    })
    const products = readFavorites().flatMap((id) => {
      const product = findDetail(productDetails, id)
      if (!product) return []
      return [{ id: product.id, category: product.category, code: product.code.replace('DAY+ / ', ''), name: product.name, image: product.images[0]?.src ?? '', price: product.price }]
    })
    return { looks, products }
  })
}

function normalizeId(id: string) {
  let normalized = String(id ?? '').trim()
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(normalized)
      if (decoded === normalized) break
      normalized = decoded
    } catch {
      break
    }
  }
  return normalized
}

function findDetail<T>(source: Record<string, T>, id: string) {
  const normalized = normalizeId(id)
  return source[normalized] ?? Object.entries(source).find(([key]) => normalizeId(key) === normalized)?.[1]
}

export function fetchLookDetail(id: string) {
  return request<LookDetail | null>('/works/look/detail', () => {
    const detail = findDetail(lookDetails, id)
    if (!detail) return null
    const favorites = readFavorites()
    return { ...detail, products: detail.products.map((product) => ({ ...product, favorite: favorites.includes(product.id) })) }
  }, { data: { id } })
}

export function fetchProductDetail(id: string) {
  return request<ProductDetail | null>('/products/detail', () => {
    const product = findDetail(productDetails, id)
    if (!product) return null
    const favorites = readFavorites()
    return { ...product, favorite: favorites.includes(product.id) }
  }, { data: { id } })
}

export function addProductToCart(product: { id: string; color: string; size: string; quantity: number }) {
  return request<{ count: number }>('/cart/items', () => ({ count: addCartItem(product) }), { method: 'POST', data: product })
}

export function setProductFavorite(id: string, favorite: boolean) {
  return request<{ favorite: boolean }>('/user/favorites/product', () => {
    const favorites = new Set(readFavorites())
    if (favorite) favorites.add(id)
    else favorites.delete(id)
    uni.setStorageSync(favoriteStorageKey, [...favorites])
    return { favorite }
  }, { method: 'POST', data: { id, favorite } })
}

export function setLookFavorite(id: string, favorite: boolean) {
  return request<{ favorite: boolean }>('/user/favorites/look', () => {
    const favorites = new Set(readFavorites(lookFavoriteStorageKey))
    if (favorite) favorites.add(id)
    else favorites.delete(id)
    uni.setStorageSync(lookFavoriteStorageKey, [...favorites])
    return { favorite }
  }, { method: 'POST', data: { id, favorite } })
}
