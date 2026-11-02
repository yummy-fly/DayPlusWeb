<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { fetchPointRecords, fetchPointsBalance } from '../../api/points'
import type { PointRecord } from '../../api/points'

const balance = ref(0)
const records = ref<PointRecord[]>([])
const loading = ref(true)

function navigate(path: string) {
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else navigate('/pages/profile/index')
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/profile/index' })
  // #endif
}

async function loadPage() {
  loading.value = true
  const [pointResult, recordResult] = await Promise.all([fetchPointsBalance(), fetchPointRecords()])
  balance.value = pointResult.points
  records.value = recordResult
  loading.value = false
}

onMounted(() => {
  loadPage()
  uni.$on('points-updated', loadPage)
})
onBeforeUnmount(() => uni.$off('points-updated', loadPage))
</script>

<template>
  <view class="points-detail-page">
    <view class="topbar"><view class="back" @tap="goBack"><view class="back-arrow" /></view><text>积分明细</text></view>
    <view class="balance-panel"><text class="eyebrow">DAY+ / POINTS</text><text class="balance-label">当前积分</text><view class="balance-line"><text class="balance-value">{{ balance.toLocaleString() }}</text><text class="balance-unit">积分</text></view><text class="balance-note">购物完成后，按消费金额 1:10 返还积分</text></view>
    <view class="mall-entry" @tap="navigate('/pages/points/index')"><view><text class="entry-kicker">DAY+ REWARDS</text><text class="entry-title">积分商城</text><text class="entry-note">用积分兑换代金券与咖啡券</text></view><text class="entry-arrow">↗</text></view>
    <view class="records-section"><view class="section-heading"><view><text class="eyebrow dark">ACTIVITY</text><text class="section-title">积分记录</text></view><text class="section-count">{{ records.length }} 条</text></view><view v-if="loading" class="status">正在加载记录…</view><view v-else-if="!records.length" class="status">暂无积分记录</view><view v-else class="record-list"><view v-for="record in records" :key="record.id" class="record-row"><view class="record-copy"><view class="record-title-line"><text class="record-title">{{ record.title }}</text><text :class="['record-amount', record.type]">{{ record.type === 'earn' ? '+' : '-' }}{{ record.amount }}</text></view><text class="record-description">{{ record.description }}</text><text class="record-date">{{ new Date(record.createdAt).toLocaleDateString('zh-CN') }}</text></view></view></view></view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.points-detail-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 60rpx; background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 5rpx; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }
.balance-panel { margin: 32rpx 30rpx 0; padding: 36rpx 34rpx 30rpx; min-height: 270rpx; display: flex; flex-direction: column; justify-content: center; background: #171716; color: #f8f7f4; }.eyebrow { color: #a7a39b; font-size: 17rpx; letter-spacing: 3rpx; }.balance-label { margin-top: 28rpx; color: rgba(248,247,244,.68); font-size: 20rpx; }.balance-line { display: flex; align-items: baseline; gap: 14rpx; }.balance-value { font-size: 66rpx; font-weight: 300; }.balance-unit { color: rgba(248,247,244,.68); font-size: 20rpx; }.balance-note { margin-top: 14rpx; color: rgba(248,247,244,.56); font-size: 18rpx; }
.mall-entry { margin: 34rpx 30rpx 0; padding: 30rpx 28rpx; display: flex; align-items: center; justify-content: space-between; background: #ebe8e1; }.entry-kicker { display: block; color: #8b8883; font-size: 16rpx; letter-spacing: 3rpx; }.entry-title { display: block; margin-top: 10rpx; font-size: 30rpx; letter-spacing: 2rpx; }.entry-note { display: block; margin-top: 10rpx; color: #77736c; font-size: 18rpx; }.entry-arrow { font-size: 34rpx; }
.records-section { padding: 58rpx 36rpx 0; }.section-heading { display: flex; align-items: flex-end; justify-content: space-between; }.eyebrow.dark { color: #8b8883; }.section-title { display: block; margin-top: 12rpx; font-size: 34rpx; font-weight: 300; letter-spacing: 3rpx; }.section-count { color: #a09b93; font-size: 18rpx; }.record-list { margin-top: 28rpx; border-top: 1px solid #dedcd7; }.record-row { padding: 26rpx 0; border-bottom: 1px solid #dedcd7; }.record-title-line { display: flex; justify-content: space-between; }.record-title { font-size: 23rpx; }.record-amount { font-size: 27rpx; }.record-amount.earn { color: #66785d; }.record-amount.redeem { color: #9b695e; }.record-description, .record-date { display: block; margin-top: 10rpx; color: #77736c; font-size: 18rpx; }.record-date { color: #aaa59d; font-size: 16rpx; }.status { min-height: 220rpx; display: flex; align-items: center; justify-content: center; color: #8b8883; font-size: 21rpx; }
</style>
