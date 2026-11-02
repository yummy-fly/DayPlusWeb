<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { fetchCouponWallet } from '../../api/coupons'
import type { CouponItem, CouponStatus } from '../../api/coupons'

const coupons = ref<CouponItem[]>([])
const activeStatus = ref<CouponStatus>('unused')
const loading = ref(true)
const failed = ref(false)
const tabs: Array<{ key: CouponStatus; label: string }> = [
  { key: 'unused', label: '未使用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' }
]
const visibleCoupons = computed(() => coupons.value.filter((item) => item.status === activeStatus.value))

onLoad(loadPage)
onShow(loadPage)

async function loadPage() {
  loading.value = true
  failed.value = false
  try {
    coupons.value = await fetchCouponWallet()
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/profile/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/profile/index' })
  // #endif
}
</script>

<template>
  <view class="coupon-page">
    <view class="topbar"><view class="back" @tap="goBack"><view class="back-arrow" /></view><text>我的券包</text></view>
    <view class="intro"><text class="eyebrow">DAY+ / MY COUPONS</text><text class="title">我的券包</text><text class="note">积分商城兑换的代金券与咖啡券都在这里。</text></view>
    <view class="tabs"><button v-for="tab in tabs" :key="tab.key" :class="['tab', { active: activeStatus === tab.key }]" @tap="activeStatus = tab.key">{{ tab.label }}<text>{{ coupons.filter((item) => item.status === tab.key).length }}</text></button></view>
    <view v-if="loading" class="status">正在加载券包…</view>
    <view v-else-if="failed" class="status"><text>加载失败，请稍后重试</text><button class="retry" @tap="loadPage">重新加载</button></view>
    <view v-else-if="!visibleCoupons.length" class="status">暂无{{ tabs.find((tab) => tab.key === activeStatus)?.label }}券</view>
    <view v-else class="coupon-list">
      <view v-for="coupon in visibleCoupons" :key="coupon.id" :class="['coupon-card', coupon.status]">
        <view class="coupon-main"><text class="coupon-type">{{ coupon.type }}</text><text class="coupon-value">{{ coupon.type === '代金券' ? `¥ ${coupon.value}` : '1 杯' }}</text><text class="coupon-name">{{ coupon.name }}</text></view>
        <view class="coupon-side"><text class="side-mark">DAY+</text><text class="side-status">{{ coupon.status === 'unused' ? '可使用' : coupon.status === 'used' ? '已使用' : '已过期' }}</text></view>
        <view class="coupon-meta"><text>兑换日期 {{ formatDate(coupon.redeemedAt) }}</text><text>有效期至 {{ formatDate(coupon.expiresAt) }}</text></view>
      </view>
    </view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.coupon-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 60rpx; background: #f8f7f4; color: #171716; }.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 5rpx; }.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }.intro { padding: 58rpx 36rpx 42rpx; }.eyebrow { color: #969189; font-size: 17rpx; letter-spacing: 3rpx; }.title { display: block; margin-top: 20rpx; font-size: 42rpx; font-weight: 300; letter-spacing: 3rpx; }.note { display: block; margin-top: 16rpx; color: #8c8881; font-size: 20rpx; }.tabs { display: flex; padding: 0 36rpx; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.tab { flex: 1; margin: 0; padding: 25rpx 0 22rpx; border-radius: 0; background: transparent; color: #969189; font-size: 20rpx; }.tab::after { border: 0; }.tab text { margin-left: 8rpx; font-size: 16rpx; }.tab.active { color: #171716; border-bottom: 3rpx solid #171716; }.coupon-list { padding: 32rpx 30rpx; display: flex; flex-direction: column; gap: 22rpx; }.coupon-card { position: relative; min-height: 230rpx; padding: 28rpx 26rpx 72rpx; display: flex; align-items: flex-start; background: #ebe8e1; border: 1px solid #dedcd7; }.coupon-main { flex: 1; display: flex; flex-direction: column; }.coupon-type { color: #77736c; font-size: 17rpx; letter-spacing: 2rpx; }.coupon-value { margin-top: 8rpx; font-size: 42rpx; font-weight: 300; }.coupon-name { margin-top: 8rpx; font-size: 21rpx; }.coupon-side { width: 110rpx; height: 110rpx; border: 1px solid #aaa49a; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-10deg); color: #77736c; }.side-mark { font-size: 21rpx; letter-spacing: 3rpx; }.side-status { margin-top: 7rpx; font-size: 15rpx; }.coupon-meta { position: absolute; left: 26rpx; right: 26rpx; bottom: 20rpx; display: flex; justify-content: space-between; color: #77736c; font-size: 16rpx; }.coupon-card.used, .coupon-card.expired { opacity: .52; }.status { min-height: 320rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22rpx; color: #8b8883; font-size: 21rpx; }.retry { padding: 0 30rpx; border-radius: 0; background: #171716; color: #fff; font-size: 22rpx; }.retry::after { border: 0; }
</style>
