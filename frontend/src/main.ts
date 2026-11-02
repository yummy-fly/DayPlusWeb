import { createSSRApp } from 'vue'
import App from './App.vue'
import { isLoggedIn } from './api/home'
import './styles.css'

export function createApp() {
  const app = createSSRApp(App)
  const memberPages = new Set([
    'pages/orders/index',
    'pages/address/index',
    'pages/coupons/index',
    'pages/appointments/index',
    'pages/appointment/index',
    'pages/profile/detail',
    'pages/points/detail',
    'pages/cart/index'
  ])
  app.mixin({
    onShow() {
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      if (page && memberPages.has(page.route ?? '') && !isLoggedIn()) {
        uni.reLaunch({ url: '/pages/profile/index' })
      }
    }
  })
  return { app }
}
