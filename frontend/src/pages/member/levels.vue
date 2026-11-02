<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchMemberProfile } from '../../api/profile'
import type { MemberProfile } from '../../data/profile'
import { memberLevels, type MemberLevel } from '../../data/profile'

const member = ref<MemberProfile | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    member.value = await fetchMemberProfile()
  } catch (error) {
    console.error('[Member] levels page load failed', error)
  } finally {
    loading.value = false
  }
})

const levelNotes: Record<string, string> = {
  普卡: '注册即享，开启 DAY+ 风格之旅',
  银卡: '银卡及以上可报名会员专享沙龙',
  金卡: '金卡及以上享受会员专属造型服务',
  白金卡: '白金卡尊享一对一风格顾问服务'
}

function levelState(level: MemberLevel) {
  if (!member.value) return ''
  const order = memberLevels.map((item) => item.level)
  const current = order.indexOf(member.value.level)
  const target = order.indexOf(level)
  if (target < current) return 'reached'
  if (target === current) return 'current'
  return ''
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/profile/detail?id=profile`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/profile/detail?id=profile' })
  // #endif
}
</script>

<template>
  <view class="levels-page">
    <view class="topbar"><text class="back" @tap="goBack">‹</text><text class="topbar-title">会员等级</text></view>

    <view class="intro">
      <text class="eyebrow">DAY+ / MEMBER TIERS</text>
      <text class="detail-title">会员等级体系</text>
      <text class="detail-note">消费累计积分，晋升更高会员等级，解锁专属权益。</text>
    </view>

    <view v-if="member" class="member-card">
      <view class="member-card-top"><text class="card-brand">DAY+</text><text class="card-level">{{ member.level }}</text></view>
      <text class="card-number">{{ member.memberNo }}</text>
      <text class="card-caption">{{ member.points.toLocaleString() }} 积分{{ member.nextLevel ? ` · 距离${member.nextLevel}还差 ${(member.nextLevelPoints! - member.points).toLocaleString()} 积分` : ' · 已达最高等级' }}</text>
    </view>

    <view v-if="loading" class="status">正在加载会员信息…</view>

    <view class="level-list">
      <view v-for="(item, index) in memberLevels" :key="item.level" :class="['level-card', levelState(item.level)]">
        <view class="level-head">
          <view class="level-name-wrap">
            <text class="level-name">{{ item.level }}</text>
            <text v-if="levelState(item.level) === 'current'" class="level-flag">当前等级</text>
            <text v-else-if="levelState(item.level) === 'reached'" class="level-flag reached">已达成的等级</text>
          </view>
          <text class="level-points">{{ item.requiredPoints.toLocaleString() }} 分</text>
        </view>
        <text class="level-note">{{ levelNotes[item.level] }}</text>
        <view v-if="member && item.requiredPoints > 0" class="level-progress">
          <view class="level-progress-track">
            <view class="level-progress-value" :style="{ width: `${Math.min(100, member.points / item.requiredPoints * 100)}%` }" />
          </view>
          <text class="level-progress-copy">{{ member.points >= item.requiredPoints ? '已达成' : `还差 ${(item.requiredPoints - member.points).toLocaleString()} 积分晋升` }}</text>
        </view>
        <view v-if="index < memberLevels.length - 1" class="level-arrow">↓</view>
      </view>
    </view>

    <view class="rules">
      <text class="rules-title">晋升规则</text>
      <view class="rule-row"><text class="rule-index">01</text><text class="rule-copy">消费 1 元累计 1 积分，积分永久有效。</text></view>
      <view class="rule-row"><text class="rule-index">02</text><text class="rule-copy">积分达到对应门槛后自动晋升，等级实时生效。</text></view>
      <view class="rule-row"><text class="rule-index">03</text><text class="rule-copy">会员余额与积分可在到店消费时合并使用。</text></view>
    </view>
  </view>
</template>

<style scoped>
.levels-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 80rpx; background: #f8f7f4; color: #171716; }
.topbar { height: 108rpx; padding: 0 30rpx; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 1px solid #e5e2dc; }
.back { position: absolute; left: 30rpx; font-size: 60rpx; line-height: 1; font-weight: 200; transform: translateY(-4rpx); }
.topbar-title { font-size: 28rpx; letter-spacing: 3rpx; }
.intro { padding: 58rpx 42rpx 42rpx; }
.eyebrow { color: #969189; font-size: 17rpx; letter-spacing: 3rpx; }
.detail-title { display: block; margin-top: 22rpx; font-size: 42rpx; font-weight: 300; letter-spacing: 3rpx; }
.detail-note { display: block; margin-top: 18rpx; color: #8c8881; font-size: 20rpx; line-height: 1.6; }
.member-card { margin: 0 42rpx 40rpx; padding: 34rpx; min-height: 210rpx; color: #f8f7f4; background: linear-gradient(135deg, #3d3b37, #171716); border-radius: 16rpx; }
.member-card-top { display: flex; align-items: center; justify-content: space-between; }
.card-brand { font-size: 34rpx; letter-spacing: 5rpx; }
.card-level { padding: 7rpx 16rpx; border: 1px solid rgba(255,255,255,.45); font-size: 18rpx; }
.card-number { display: block; margin-top: 48rpx; font-size: 25rpx; letter-spacing: 4rpx; }
.card-caption { display: block; margin-top: 16rpx; color: rgba(255,255,255,.6); font-size: 15rpx; letter-spacing: 3rpx; }
.status { min-height: 200rpx; display: flex; align-items: center; justify-content: center; color: #8c8881; font-size: 21rpx; }
.level-list { padding: 0 42rpx; }
.level-card { position: relative; margin-bottom: 28rpx; padding: 32rpx 30rpx 30rpx; background: #fdfcf9; border: 1px solid #dedcd7; }
.level-card.current { border-color: #171716; background: #f6f4ef; }
.level-card.reached { border-color: #c8b998; }
.level-head { display: flex; align-items: center; justify-content: space-between; }
.level-name-wrap { display: flex; align-items: center; gap: 16rpx; }
.level-name { font-size: 30rpx; letter-spacing: 2rpx; }
.level-flag { padding: 6rpx 12rpx; color: #f8f7f4; background: #171716; font-size: 15rpx; letter-spacing: 1rpx; }
.level-flag.reached { color: #8c7448; background: #f2ece2; border: 1px solid #c8b998; }
.level-points { color: #8c7448; font-size: 22rpx; }
.level-note { display: block; margin-top: 16rpx; color: #77736d; font-size: 19rpx; line-height: 1.6; }
.level-progress { margin-top: 22rpx; }
.level-progress-track { height: 8rpx; background: #e9e6df; border-radius: 8rpx; overflow: hidden; }
.level-progress-value { height: 100%; background: #9c845b; }
.level-progress-copy { display: block; margin-top: 12rpx; color: #969189; font-size: 17rpx; }
.level-arrow { position: absolute; bottom: -28rpx; left: 50%; transform: translate(-50%, -50%); width: 44rpx; height: 44rpx; display: flex; align-items: center; justify-content: center; color: #969189; background: #f8f7f4; font-size: 20rpx; z-index: 1; }
.rules { margin: 16rpx 42rpx 0; padding: 32rpx 30rpx; background: #fdfcf9; border: 1px solid #dedcd7; }
.rules-title { font-size: 25rpx; }
.rule-row { display: flex; gap: 20rpx; margin-top: 24rpx; align-items: baseline; }
.rule-index { flex-shrink: 0; color: #c6c2bb; font-size: 17rpx; letter-spacing: 2rpx; }
.rule-copy { color: #77736d; font-size: 19rpx; line-height: 1.6; }
</style>
