<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { exchangeReward, fetchRewardItems } from '../../api/points'
import { fetchPoints } from '../../api/home'
import type { RewardItem, RewardType } from '../../data/points'

const balance = ref(0)
const rewards = ref<RewardItem[]>([])
const selectedType = ref<'全部' | RewardType>('全部')
const loading = ref(true)
const failed = ref(false)
const exchanging = ref<string[]>([])
const filters: Array<'全部' | RewardType> = ['全部', '代金券', '咖啡兑换券']
const visibleRewards = computed(() => selectedType.value === '全部' ? rewards.value : rewards.value.filter((item) => item.type === selectedType.value))

onLoad(loadPage)
onShow(loadPage)

async function loadPage() {
  loading.value = true
  failed.value = false
  try {
    const [result, pointResult] = await Promise.all([fetchRewardItems(), fetchPoints()])
    rewards.value = result
    balance.value = Number(uni.getStorageSync('dayplus-points') || pointResult.points)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function exchange(item: RewardItem) {
  if (exchanging.value.includes(item.id)) return
  if (balance.value < item.points) {
    uni.showToast({ title: '积分不足', icon: 'none' })
    return
  }
  exchanging.value.push(item.id)
  try {
    const result = await exchangeReward(item.id, item.points)
    if (!result.success) {
      balance.value = result.points
      uni.showToast({ title: '积分不足', icon: 'none' })
      return
    }
    balance.value = result.points
    uni.showToast({ title: '兑换成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '兑换失败，请稍后重试', icon: 'none' })
  } finally {
    exchanging.value = exchanging.value.filter((id) => id !== item.id)
  }
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/home/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/home/index' })
  // #endif
}
</script>

<template>
  <view class="points-page">
    <view class="topbar">
      <view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view>
      <text>积分商城</text>
    </view>
    <view class="balance-panel">
      <text class="eyebrow">DAY+ / REWARDS</text>
      <text class="balance-label">可用积分</text>
      <view class="balance-line"><text class="balance-value">{{ balance.toLocaleString() }}</text><text class="balance-unit">积分</text></view>
      <view class="balance-foot"><text>每一份喜爱，都值得被珍藏。</text><text class="balance-mark">DAY+</text></view>
    </view>
    <view class="catalog">
      <view class="section-heading"><view><text class="eyebrow dark">REDEEM YOUR POINTS</text><text class="section-title">精选礼遇</text></view><text class="item-count">{{ String(visibleRewards.length).padStart(2, '0') }} ITEMS</text></view>
      <view class="filters"><button v-for="filter in filters" :key="filter" :class="['filter', { active: selectedType === filter }]" @tap="selectedType = filter">{{ filter }}</button></view>
      <view v-if="loading" class="status">正在加载礼遇…</view>
      <view v-else-if="failed" class="status"><text>加载失败，请稍后重试</text><button class="retry" @tap="loadPage">重新加载</button></view>
      <view v-else class="reward-list">
        <view v-for="item in visibleRewards" :key="item.id" class="reward-card">
          <view class="ticket">
            <view class="ticket-main"><text class="ticket-type">{{ item.type }}</text><text class="ticket-value">{{ item.value }}</text><text class="ticket-name">{{ item.name }}</text></view>
            <view class="ticket-perforation"><view /><view /></view>
            <view class="ticket-stamp"><text>DAY+</text><text>REWARD</text></view>
          </view>
          <view class="reward-info">
            <view class="reward-copy"><text class="reward-description">{{ item.description }}</text><text class="reward-validity">{{ item.validity }}</text></view>
            <button class="exchange-button" :disabled="balance < item.points || exchanging.includes(item.id)" @tap="exchange(item)">
              <text class="exchange-cost">{{ item.points.toLocaleString() }} 积分</text><text>{{ exchanging.includes(item.id) ? '兑换中' : balance < item.points ? '积分不足' : '立即兑换' }}</text>
            </button>
          </view>
        </view>
      </view>
      <view v-if="!loading && !failed && !visibleRewards.length" class="status">暂无可兑换礼遇</view>
    </view>
    <view class="footer"><text class="footer-brand">DAY+</text><text>感谢你，让日常更有意义。</text></view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.points-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: calc(48rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 5rpx; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }
.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }
.balance-panel { margin: 32rpx 30rpx 0; padding: 36rpx 34rpx 30rpx; min-height: 282rpx; display: flex; flex-direction: column; justify-content: center; background: #171716; color: #f8f7f4; }
.eyebrow { color: #a7a39b; font-size: 17rpx; letter-spacing: 3rpx; }
.balance-label { margin-top: 28rpx; color: rgba(248,247,244,.68); font-size: 20rpx; letter-spacing: 2rpx; }
.balance-line { margin-top: 2rpx; display: flex; align-items: baseline; gap: 14rpx; }
.balance-value { font-size: 66rpx; font-weight: 300; letter-spacing: 2rpx; }
.balance-unit { color: rgba(248,247,244,.68); font-size: 20rpx; }
.balance-foot { margin-top: 12rpx; display: flex; align-items: center; justify-content: space-between; color: rgba(248,247,244,.56); font-size: 18rpx; letter-spacing: 1rpx; }
.balance-mark { color: rgba(248,247,244,.78); font-size: 19rpx; letter-spacing: 4rpx; }
.catalog { padding: 58rpx 36rpx 0; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; }
.eyebrow.dark { color: #8b8883; }
.section-title { display: block; margin-top: 12rpx; font-size: 34rpx; font-weight: 300; letter-spacing: 3rpx; }
.item-count { color: #a09b93; font-size: 17rpx; letter-spacing: 2rpx; }
.filters { margin: 30rpx 0 26rpx; display: flex; gap: 12rpx; }
.filter { margin: 0; padding: 13rpx 20rpx; border: 1px solid #dedcd7; border-radius: 0; background: transparent; color: #77736c; font-size: 19rpx; line-height: 1.4; }
.filter::after, .exchange-button::after { border: none; }
.filter.active { border-color: #171716; background: #171716; color: #f8f7f4; }
.reward-list { display: flex; flex-direction: column; gap: 24rpx; }
.reward-card { border: 1px solid #dedcd7; background: #fdfcf9; }
.ticket { min-height: 198rpx; padding: 26rpx 24rpx; display: flex; align-items: center; background: #eeece7; }
.ticket-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ticket-type { color: #8b8883; font-size: 17rpx; letter-spacing: 2rpx; }
.ticket-value { margin-top: 6rpx; font-size: 42rpx; line-height: 1.35; font-weight: 300; letter-spacing: 2rpx; }
.ticket-name { margin-top: 6rpx; font-size: 20rpx; letter-spacing: 1rpx; }
.ticket-perforation { position: relative; align-self: stretch; width: 1px; margin: 0 24rpx; border-left: 1px dashed #c7c2b9; }
.ticket-perforation view { position: absolute; left: -10rpx; width: 20rpx; height: 20rpx; border-radius: 50%; background: #fdfcf9; }
.ticket-perforation view:first-child { top: -36rpx; }
.ticket-perforation view:last-child { bottom: -36rpx; }
.ticket-stamp { width: 90rpx; height: 90rpx; flex: 0 0 90rpx; border: 1px solid #b5afa5; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; color: #77736c; transform: rotate(-10deg); }
.ticket-stamp text:first-child { font-size: 20rpx; letter-spacing: 2rpx; }
.ticket-stamp text:last-child { font-size: 11rpx; letter-spacing: 1rpx; }
.reward-info { min-height: 100rpx; padding: 20rpx 22rpx; display: flex; align-items: center; justify-content: space-between; gap: 18rpx; }
.reward-copy { min-width: 0; display: flex; flex-direction: column; gap: 9rpx; }
.reward-description { font-size: 18rpx; line-height: 1.5; }
.reward-validity { color: #969189; font-size: 16rpx; }
.exchange-button { flex: 0 0 auto; min-height: 66rpx; margin: 0; padding: 8rpx 16rpx; border-radius: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; background: #171716; color: #f8f7f4; font-size: 17rpx; line-height: 1.4; }
.exchange-button[disabled] { background: #c8c4bd; color: #f8f7f4; }
.exchange-cost { font-size: 15rpx; color: rgba(248,247,244,.7); }
.status { min-height: 240rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22rpx; color: #8b8883; font-size: 22rpx; text-align: center; }
.retry { padding: 0 30rpx; border-radius: 0; background: #171716; color: #fff; font-size: 22rpx; }
.footer { padding: 70rpx 0 20rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; color: #9b968e; font-size: 18rpx; letter-spacing: 3rpx; }
.footer-brand { color: #171716; font-size: 26rpx; font-weight: 600; letter-spacing: 5rpx; }
@media (min-width: 700px) { .points-page { box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
