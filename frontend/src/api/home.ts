import { ref } from 'vue'
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

export const loginState = ref(uni.getStorageSync(LOGIN_STORAGE_KEY) === true)

export function isLoggedIn() {
  loginState.value = uni.getStorageSync(LOGIN_STORAGE_KEY) === true
  return loginState.value
}

/** 模拟微信授权登录，成功后保存本地登录状态。 */
export async function login() {
  const result = await request('/auth/wechat/login', () => fetchPointsBalance(), { method: 'POST' })
  uni.setStorageSync(LOGIN_STORAGE_KEY, true)
  loginState.value = true
  return result
}

/** 模拟退出登录，接口成功后清除会话，保留模拟账号的业务数据。 */
export async function logout() {
  await request('/auth/logout', () => ({ success: true }), { method: 'POST' })
  uni.removeStorageSync(LOGIN_STORAGE_KEY)
  loginState.value = false
}
