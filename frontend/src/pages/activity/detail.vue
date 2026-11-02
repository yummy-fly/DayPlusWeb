<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchActivityDetail } from '../../api/activity'
import type { ActivityDetail } from '../../data/activity'

const detail = ref<ActivityDetail | null>(null)
const activityId = ref('')
const loading = ref(true)
const failed = ref(false)

onLoad((query) => {
  activityId.value = String(query?.id ?? '')
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  failed.value = false
  try {
    detail.value = await fetchActivityDetail(activityId.value)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/activity/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/activity/index' })
  // #endif
}
</script>

<template>
  <view class="detail-page">
    <view class="topbar">
      <view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view>
      <image class="brand" src="/static/dayplus-logo.png" mode="aspectFit" /><text class="topbar-label">活动详情</text>
    </view>
    <view v-if="loading" class="status">正在加载活动…</view>
    <view v-else-if="failed" class="status"><text>加载失败，请稍后重试</text><button class="retry" @tap="loadDetail">重新加载</button></view>
    <template v-else-if="detail">
      <view class="intro">
        <text class="eyebrow">DAY+ / {{ detail.type }}</text>
        <text class="title">{{ detail.name }}</text>
        <text class="time">{{ detail.date.replace(/-/g, '.') }} · {{ detail.startTime }} — {{ detail.endTime }}</text>
      </view>
      <view class="article">
        <view v-for="(block, index) in detail.content" :key="index" :class="['content-block', block.type]">
          <template v-if="block.type === 'image'">
            <image class="article-image" :src="block.src" :alt="block.caption" mode="widthFix" />
            <text class="caption">{{ block.caption }}</text>
          </template>
          <text v-else class="paragraph">{{ block.text }}</text>
        </view>
      </view>
      <view class="footer"><image class="footer-brand" src="/static/dayplus-logo.png" mode="aspectFit" /><text>日常之中，自有风格。</text></view>
    </template>
    <view v-else class="status"><text>该活动暂不存在</text><button class="retry" @tap="goBack">返回活动日历</button></view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.detail-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: env(safe-area-inset-bottom); background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding: var(--status-bar-height, 0px) 36rpx 0; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }
.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }
.brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }
.topbar-label { position: absolute; right: 36rpx; bottom: 40rpx; font-size: 19rpx; color: #8b8883; letter-spacing: 2rpx; }
.intro { padding: 48rpx 42rpx 42rpx; }
.eyebrow { font-size: 17rpx; letter-spacing: 3rpx; color: #8b8883; }
.title { display: block; margin-top: 24rpx; font-size: 38rpx; line-height: 1.6; font-weight: 300; letter-spacing: 3rpx; }
.time { display: block; margin-top: 24rpx; color: #8b8883; font-size: 22rpx; line-height: 1.7; letter-spacing: 1rpx; }
.content-block.image { margin: 0 0 36rpx; }
.article-image { display: block; width: 100%; background: #ebe8e2; }
.caption { display: block; padding: 18rpx 42rpx 0; font-size: 19rpx; line-height: 1.8; color: #969189; letter-spacing: 1rpx; }
.content-block.text { padding: 0 42rpx; margin-bottom: 30rpx; }
.paragraph { display: block; font-size: 25rpx; line-height: 2; color: #77736c; letter-spacing: 1rpx; white-space: pre-line; }
.footer { margin: 54rpx 42rpx 0; padding: 44rpx 0 50rpx; border-top: 1px solid #dedcd7; display: flex; flex-direction: column; align-items: center; gap: 18rpx; font-size: 19rpx; color: #9b968e; letter-spacing: 3rpx; }
.footer-brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }
.status { min-height: 60vh; padding: 80rpx 42rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30rpx; color: #8b8883; font-size: 24rpx; text-align: center; }
.retry { padding: 0 36rpx; border-radius: 0; background: #171716; color: #fff; font-size: 24rpx; }
@media (min-width: 700px) { .detail-page { box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
