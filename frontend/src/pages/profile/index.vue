<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchProfileSummary } from '../../api/profile'
import { isLoggedIn, loginState, login as apiLogin, logout as apiLogout } from '../../api/home'
import type { ProfileSummary } from '../../data/profile'

const summary = ref<ProfileSummary | null>(null)
const loading = ref(false)
const loggedIn = loginState
const loggingIn = ref(false)
const loggingOut = ref(false)
let profileRequest = 0
const loadError = ref(false)

const svgIcon = (paths: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`)

const navItems = [
  { key: 'home', label: '首页', path: '/pages/home/index', icon: svgIcon('<path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z"/><path d="M9.5 21.5v-7h5v7"/>') },
  { key: 'works', label: '作品', path: '/pages/works/index', icon: svgIcon('<path d="M10 4.5a2 2 0 1 1 2 2V8"/><path d="M12 8l9.2 6.4a1.4 1.4 0 0 1-.8 2.6H3.6a1.4 1.4 0 0 1-.8-2.6L12 8z"/>') },
  { key: 'service', label: '服务', path: '/pages/service/index', icon: svgIcon('<path d="M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>') },
  { key: 'mine', label: '我的', path: '/pages/profile/index', icon: svgIcon('<path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/>') }
]

onShow(() => {
  loggedIn.value = isLoggedIn()
  if (loggedIn.value) {
    loadProfile()
  } else {
    summary.value = null
  }
})

async function loadProfile() {
  const requestId = ++profileRequest
  loading.value = true
  loadError.value = false
  try {
    const result = await fetchProfileSummary()
    if (requestId === profileRequest && isLoggedIn()) summary.value = result
  } catch {
    if (requestId === profileRequest && isLoggedIn()) loadError.value = true
  } finally {
    if (requestId === profileRequest) loading.value = false
  }
}

async function login() {
  if (loggingIn.value) return
  loggingIn.value = true
  try {
    await apiLogin()
    loggedIn.value = true
    await loadProfile()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
  } finally {
    loggingIn.value = false
  }
}

function confirmLogout() {
  if (loggingOut.value) return
  uni.showModal({
    title: '退出登录',
    content: '退出后将无法查看个人积分、订单和会员信息，是否继续？',
    confirmText: '退出登录',
    cancelText: '取消',
    success: (result) => {
      if (result.confirm) logout()
    }
  })
}

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await apiLogout()
    ++profileRequest
    summary.value = null
    loading.value = false
    loadError.value = false
    uni.showToast({ title: '已退出登录', icon: 'success' })
  } catch {
    uni.showToast({ title: '退出失败，请稍后重试', icon: 'none' })
  } finally {
    loggingOut.value = false
  }
}

function navigate(path: string) {
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

function openModule(id: string) {
  if (id === 'orders') {
    navigate('/pages/orders/index')
    return
  }
  if (id === 'addresses') {
    navigate('/pages/address/index')
    return
  }
  if (id === 'points') {
    navigate('/pages/points/detail')
    return
  }
  if (id === 'coupons') {
    navigate('/pages/coupons/index')
    return
  }
  if (id === 'appointments') {
    navigate('/pages/appointments/index')
    return
  }
  navigate(`/pages/profile/detail?id=${encodeURIComponent(id)}`)
}
</script>

<template>
  <view class="profile-page">
    <view class="topbar"><text class="topbar-kicker">DAY+ / PERSONAL</text><text class="topbar-title">我的</text></view>

    <view v-if="!loggedIn" class="login-panel">
      <view class="login-hero">
        <view class="avatar"><image class="avatar-logo" src="/static/dayplus-logo.png" mode="aspectFit" /></view>
        <view class="profile-copy">
          <text class="member-label">DAY+ STYLE MEMBER</text>
          <text class="profile-name">欢迎来到 DAY+</text>
        </view>
      </view>
      <view class="login-copy">
        <text class="login-title">开启您的专属日常</text>
        <text class="login-note">微信授权登录后，查看积分、订单与消费档案，收藏喜欢的单品与造型。</text>
        <button class="login-button" :loading="loggingIn" :disabled="loggingIn" @tap="login">{{ loggingIn ? '正在授权登录…' : '微信授权登录' }}</button>
        <text class="login-caption">当前为模拟微信授权，点击即可体验登录</text>
      </view>
      <view class="footer-mark"><image class="footer-logo" src="/static/dayplus-logo.png" mode="aspectFit" /><text>WEAR YOUR OWN STORY</text></view>
    </view>
    <view v-else-if="loading" class="loading">正在加载个人信息…</view>
    <view v-else-if="loadError" class="loading">
      <text>个人信息加载失败，请稍后重试</text>
      <button class="login-button" @tap="loadProfile">重新加载</button>
    </view>
    <template v-else-if="summary">
      <view class="profile-hero" @tap="openModule('profile')">
        <view class="avatar"><image class="avatar-image" :src="summary.avatar" mode="aspectFill" /></view>
        <view class="profile-copy"><text class="member-label">{{ summary.memberLabel }}</text><text class="profile-name">{{ summary.name }}</text><view class="level-badge"><text>{{ summary.memberLevel }}</text><text class="level-arrow">›</text></view></view>
        <text class="arrow">↗</text>
      </view>

      <view class="points-band" @tap="openModule('points')">
        <view><text class="band-label">DAY+ 积分</text><text class="band-caption">积分记录与专属礼遇</text></view>
        <view class="balance"><text>{{ summary.points.toLocaleString() }}</text><small>积分　›</small></view>
      </view>

      <view class="section orders-section">
        <view class="section-heading" @tap="openModule('orders')"><view><text class="eyebrow">PURCHASE</text><text class="section-title">我的订单</text></view><text class="more">全部订单　›</text></view>
        <view class="order-grid">
          <view v-for="item in summary.orderCounts" :key="item.key" class="order-item" @tap="navigate(`/pages/orders/index?status=${item.key}`)"><text class="order-count">{{ item.count }}</text><text class="order-label">{{ item.label }}</text></view>
        </view>
      </view>

      <view class="section services-section">
        <view class="section-heading"><view><text class="eyebrow">MY DAY+</text><text class="section-title">个人服务</text></view></view>
        <view class="module-list">
          <view v-for="module in summary.modules" :key="module.id" class="module-row" @tap="openModule(module.id)">
            <view class="module-copy"><text class="module-title">{{ module.title }}</text><text class="module-subtitle">{{ module.subtitle }}</text></view><text class="row-arrow">↗</text>
          </view>
        </view>
      </view>

      <view class="footer-mark"><image class="footer-logo" src="/static/dayplus-logo.png" mode="aspectFit" /><text>WEAR YOUR OWN STORY</text></view>
    </template>

    <view v-if="loggedIn" class="logout-panel">
      <button class="logout-button" :loading="loggingOut" :disabled="loggingOut" @tap="confirmLogout">{{ loggingOut ? '正在退出…' : '退出登录' }}</button>
      <text class="login-caption">当前使用模拟账号，退出后可重新微信授权登录</text>
    </view>

    <view class="bottom-nav">
      <view v-for="item in navItems" :key="item.key" :class="['nav-item', { active: item.key === 'mine' }]" @tap="item.key !== 'mine' && navigate(item.path)"><image class="nav-icon" :src="item.icon" /><text>{{ item.label }}</text></view>
    </view>
    <FloatingCart v-if="loggedIn" />
  </view>
</template>

<style scoped>
.profile-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: calc(128rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { height: 116rpx; padding: 0 42rpx; display: flex; flex-direction: column; justify-content: center; border-bottom: 1px solid #e5e2dc; }
.topbar-kicker, .eyebrow { color: #969189; font-size: 16rpx; letter-spacing: 2rpx; }
.topbar-title { margin-top: 8rpx; font-size: 29rpx; letter-spacing: 4rpx; }
.profile-hero { min-height: 210rpx; padding: 36rpx 42rpx; display: flex; align-items: center; border-bottom: 1px solid #e1ded8; }
.avatar { width: 100rpx; height: 100rpx; display: flex; align-items: center; justify-content: center; background: #e9e6df; }
.avatar-logo { width: 78rpx; height: 26rpx; }
.avatar-image { width: 100%; height: 100%; }
.level-badge { display: inline-flex; align-items: center; gap: 8rpx; width: fit-content; margin-top: 4rpx; padding: 6rpx 14rpx; border: 1px solid #c8b998; color: #8c7448; font-size: 17rpx; letter-spacing: 1rpx; }
.level-arrow { font-size: 24rpx; line-height: 14rpx; }
.login-hero { min-height: 210rpx; padding: 36rpx 42rpx; display: flex; align-items: center; border-bottom: 1px solid #e1ded8; }
.login-copy { padding: 68rpx 42rpx 0; }
.login-title, .login-note, .login-caption { display: block; }
.login-title { font-size: 31rpx; letter-spacing: 2rpx; }
.login-note { margin-top: 24rpx; color: #8c8881; font-size: 22rpx; line-height: 1.9; }
.login-button { margin-top: 42rpx; padding: 26rpx 20rpx; border-radius: 0; background: #171716; color: #f8f7f4; font-size: 24rpx; letter-spacing: 3rpx; line-height: 1.5; }
.login-button::after { border: 0; }
.login-button[disabled] { background: #77736d; color: #f8f7f4; }
.logout-panel { padding: 0 42rpx 44rpx; }
.logout-button { padding: 24rpx 20rpx; border: 1px solid #d8d4cc; border-radius: 0; background: transparent; color: #77736d; font-size: 23rpx; letter-spacing: 3rpx; line-height: 1.5; }
.logout-button::after { border: 0; }
.logout-button[disabled] { color: #a29d95; background: #efede8; }
.login-caption { margin-top: 22rpx; color: #969189; font-size: 18rpx; text-align: center; line-height: 1.7; }
.profile-copy { flex: 1; margin-left: 24rpx; display: flex; flex-direction: column; gap: 12rpx; }
.member-label { color: #8f8b84; font-size: 16rpx; letter-spacing: 2rpx; }
.profile-name { font-size: 27rpx; }
.arrow, .row-arrow { color: #77736d; font-size: 25rpx; }
.points-band { margin: 0 42rpx; padding: 30rpx 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dedcd7; }
.band-label, .band-caption { display: block; }
.band-label { font-size: 23rpx; letter-spacing: 1rpx; }
.band-caption { margin-top: 10rpx; color: #8c8881; font-size: 18rpx; }
.balance { display: flex; align-items: baseline; gap: 10rpx; }
.balance text { font-size: 38rpx; font-weight: 300; }
.balance small { color: #77736d; font-size: 17rpx; }
.section { padding: 58rpx 42rpx 0; }
.section-heading { display: flex; justify-content: space-between; align-items: flex-end; }
.section-title { display: block; margin-top: 12rpx; font-size: 31rpx; font-weight: 400; letter-spacing: 2rpx; }
.more { color: #77736d; font-size: 18rpx; }
.order-grid { margin-top: 34rpx; display: grid; grid-template-columns: repeat(5, 1fr); }
.order-item { min-height: 104rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #e5e2dc; }
.order-item:last-child { border-right: 0; }
.order-count { font-size: 26rpx; }
.order-label { margin-top: 12rpx; color: #77736d; font-size: 17rpx; }
.services-section { padding-top: 68rpx; }
.module-list { margin-top: 26rpx; border-top: 1px solid #dedcd7; }
.module-row { min-height: 112rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dedcd7; }
.module-copy { display: flex; flex-direction: column; gap: 9rpx; }
.module-title { font-size: 23rpx; letter-spacing: 1rpx; }
.module-subtitle { color: #928e87; font-size: 17rpx; }
.footer-mark { padding: 72rpx 0 40rpx; text-align: center; }
.footer-logo { display: block; width: 96rpx; height: 32rpx; margin: 0 auto; }
.footer-mark text { display: block; margin-top: 12rpx; color: #a29d95; font-size: 14rpx; font-weight: 400; letter-spacing: 3rpx; }
.loading { padding: 100rpx 42rpx; color: #8c8881; font-size: 21rpx; }
.bottom-nav { position: fixed; z-index: 10; left: 50%; bottom: 0; width: 100%; max-width: 540px; box-sizing: border-box; transform: translateX(-50%); padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); display: flex; justify-content: space-around; background: rgba(248,247,244,.97); border-top: 1px solid rgba(222,220,215,.6); }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; color: #9b968e; font-size: 19rpx; letter-spacing: 2rpx; }
.nav-item.active { color: #171716; }
.nav-icon { width: 40rpx; height: 40rpx; opacity: .55; }
.nav-item.active .nav-icon { opacity: 1; }
@media (min-width: 700px) { .profile-page { box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
