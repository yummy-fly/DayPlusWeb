import { request } from './request'
import { heroSlides, looks, products } from '../data/home'
import { fetchPointsBalance } from './points'
import type { HeroSlide, Look, Product } from '../data/home'

/** 首页轮播 */
export function fetchHeroSlides() {
  return request<HeroSlide[]>('/home/slides', () => heroSlides)
}

/** 成品搭配（LOOK）列表 */
export function fetchLooks() {
  return request<Look[]>('/home/looks', () => looks)
}

/** 推荐商品列表 */
export function fetchProducts() {
  return request<Product[]>('/home/products', () => products)
}

/** 用户积分余额 */
export function fetchPoints() {
  return fetchPointsBalance()
}

const LOGIN_STORAGE_KEY = 'dayplus-wechat-logged-in'

export function isLoggedIn() {
  return uni.getStorageSync(LOGIN_STORAGE_KEY) === true
}

/** 模拟微信授权登录，成功后保存本地登录状态。 */
export async function login() {
  const result = await fetchPointsBalance()
  uni.setStorageSync(LOGIN_STORAGE_KEY, true)
  return result
}
