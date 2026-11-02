<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { fetchSalonDetail, fetchSalonBooking, bookSalon } from '../../api/salon'
import type { SalonPayment } from '../../api/salon'
import type { Salon } from '../../data/salon'
import type { MemberProfile } from '../../data/profile'
import type { AppointmentRecord } from '../../api/appointment'
import { fetchMemberProfile } from '../../api/profile'
import { isLoggedIn, login } from '../../api/home'

const id = ref('')
const detail = ref<Salon | null>(null)
const member = ref<MemberProfile | null>(null)
const booking = ref<AppointmentRecord | null>(null)
const loading = ref(true)
const failed = ref(false)
const submitting = ref(false)
const showPayment = ref(false)
const payment = ref<SalonPayment>('wechat')
const isMember = computed(() => !!member.value && ['银卡', '金卡', '白金卡'].includes(member.value.level))
const currentBooking = computed(() => booking.value?.salonId === id.value && booking.value.status !== 'cancelled' ? booking.value : null)
const ended = computed(() => !!detail.value && new Date(`${detail.value.date}T${detail.value.startTime}:00`).getTime() <= Date.now())
const full = computed(() => !!detail.value && detail.value.reserved >= detail.value.capacity)
const restricted = computed(() => detail.value?.access === 'members' && isLoggedIn() && !isMember.value)
const buttonLabel = computed(() => currentBooking.value ? '已报名 · 查看我的预约' : ended.value ? '报名已结束' : full.value ? '本场已满员' : restricted.value ? '仅限 银卡及以上会员' : detail.value?.price ? '立即报名' : '免费报名')

onLoad((query) => { id.value = String(query?.id ?? ''); loadDetail() })
onShow(() => { if (id.value && !loading.value) loadDetail() })

async function loadDetail() {
  const salonId = id.value
  loading.value = true
  failed.value = false
  booking.value = null
  showPayment.value = false
  try {
    const [salon, record, profile] = await Promise.all([fetchSalonDetail(salonId), fetchSalonBooking(salonId), isLoggedIn() ? fetchMemberProfile() : Promise.resolve(null)])
    if (id.value !== salonId) return
    detail.value = salon
    booking.value = record?.salonId === salonId ? record : null
    member.value = profile
  } catch (error) {
    console.error('[Salon] 详情加载失败', error)
    failed.value = true
  } finally { loading.value = false }
}

function navigate(path: string) {
  uni.navigateTo({ url: path })
}
function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else navigate('/pages/home/index')
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/home/index' })
  // #endif
}
async function startBooking() {
  if (submitting.value || !detail.value) return
  if (currentBooking.value) { navigate('/pages/appointments/index'); return }
  submitting.value = true
  try {
    if (!isLoggedIn()) {
      const result = await uni.showModal({ title: '登录后报名', content: '登录后即可报名参与沙龙活动。', confirmText: '登录继续' })
      if (!result.confirm) return
      await login()
    }
    member.value = await fetchMemberProfile()
    if (detail.value.access === 'members' && !isMember.value) { uni.showToast({ title: '本场仅限 银卡及以上会员', icon: 'none' }); return }
    payment.value = detail.value.price > 0 ? 'wechat' : 'free'
    showPayment.value = true
  } catch (error) {
    console.error('[Salon] 报名准备失败', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally { submitting.value = false }
}
async function confirmBooking() {
  if (!detail.value || submitting.value) return
  submitting.value = true
  try {
    if (detail.value.price > 0) {
      const result = await uni.showModal({ title: '确认支付（模拟）', content: `本次将${payment.value === 'balance' ? '从会员卡余额扣除' : '模拟微信支付'} ¥${detail.value.price.toFixed(2)}，成功后确认报名。`, confirmText: '确认支付' })
      if (!result.confirm) return
    }
    booking.value = await bookSalon(detail.value.id, detail.value.price > 0 ? payment.value : 'free')
    showPayment.value = false
    await loadDetail()
    uni.showToast({ title: '报名成功', icon: 'success' })
  } catch (error) {
    console.error('[Salon] 报名失败', error)
    uni.showToast({ title: error instanceof Error ? error.message : '报名失败，请重试', icon: 'none' })
  } finally { submitting.value = false }
}
</script>

<template>
  <view class="salon-page">
    <view class="topbar"><view class="back" @tap="goBack">‹</view><image class="brand" src="/static/dayplus-logo.png" mode="aspectFit" /><text>主题沙龙</text></view>
    <view v-if="loading" class="status">正在加载沙龙…</view>
    <view v-else-if="failed" class="status" @tap="loadDetail">加载失败，点击重试</view>
    <view v-else-if="!detail" class="status">该沙龙活动不存在</view>
    <template v-else>
      <image class="cover" :src="detail.cover" mode="aspectFill" @error="detail.cover = detail.fallbackCover" />
      <view class="intro"><text class="eyebrow">DAY+ / THE SALON EXPERIENCE</text><text class="title">{{ detail.title }}</text><text class="subtitle">{{ detail.subtitle }}</text><view class="tags"><text>{{ detail.access === 'members' ? '银卡及以上会员专享' : '对外开放' }}</text><text>{{ detail.price ? `¥${detail.price} / 位` : '免费参与' }}</text></view></view>
      <view class="facts"><view><text>活动时间</text><text>{{ detail.date.replace(/-/g, '.') }}　{{ detail.startTime }} — {{ detail.endTime }}</text></view><view><text>活动地点</text><text>{{ detail.location }}</text></view><view><text>分享嘉宾</text><text>{{ detail.host }} · DAY+ 造型顾问</text></view><view><text>活动名额</text><text>{{ detail.capacity }} 位 · 剩余 {{ Math.max(0, detail.capacity - detail.reserved) }} 位</text></view></view>
      <view class="section"><text class="eyebrow">ABOUT THE SALON</text><text class="section-title">关于本场沙龙</text><text v-for="paragraph in detail.introduction" :key="paragraph" class="paragraph">{{ paragraph }}</text></view>
      <view class="section"><text class="eyebrow">THE PROGRAMME</text><text class="section-title">活动安排</text><view v-for="item in detail.agenda" :key="item.time" class="agenda"><text>{{ item.time }}</text><text>{{ item.title }}</text></view></view>
      <view class="section tips"><text class="section-title">报名须知</text><text class="paragraph">{{ detail.access === 'members' ? '本场仅向银卡及以上会员开放。' : '本场向所有用户开放，登录后即可报名。' }}{{ detail.price ? '本场为付费活动，支付成功后方可确认名额；银卡及以上会员 可使用会员卡充值余额支付。' : '本场免费，确认报名后保留名额。' }}</text><text class="paragraph">请提前 10 分钟到场。报名记录可在“我的预约”查看和取消；付费报名取消后按原支付方式模拟退款。</text></view>
      <view v-if="currentBooking" class="success">报名已确认，期待与你相见。<text @tap="navigate('/pages/appointments/index')">查看我的预约　↗</text></view>
      <view class="action-bar"><view><text class="price">{{ detail.price ? `¥${detail.price}` : '免费' }}</text><text class="price-tip">{{ detail.access === 'members' ? '银卡及以上会员专享' : '每位 / 含活动体验' }}</text></view><button :disabled="submitting || (!currentBooking && (ended || full || restricted))" @tap="startBooking">{{ submitting ? '处理中…' : buttonLabel }}</button></view>
    </template>
    <view v-if="showPayment && detail" class="mask" @tap="!submitting && (showPayment = false)"><view class="sheet" @tap.stop>
      <view class="sheet-heading"><text>确认报名</text><button :disabled="submitting" @tap="showPayment = false">×</button></view><text class="sheet-title">{{ detail.title }}</text><text class="subtitle">{{ detail.date }}　{{ detail.startTime }} — {{ detail.endTime }}</text>
      <template v-if="detail.price"><view class="payment-row" @tap="payment = 'wechat'"><text>微信支付</text><text>{{ payment === 'wechat' ? '●' : '○' }}</text></view><view v-if="isMember" class="payment-row" @tap="member && member.balance >= detail.price && (payment = 'balance')"><view><text>会员卡余额</text><text class="balance">可用 ¥{{ member?.balance.toFixed(2) }}{{ member && member.balance < detail.price ? ' · 余额不足' : '' }}</text></view><text>{{ payment === 'balance' ? '●' : '○' }}</text></view></template>
      <text v-else class="free-note">会员专享免费场，确认后即为您保留名额。</text>
      <view class="total"><text>报名费用</text><text>¥{{ detail.price.toFixed(2) }}</text></view><button class="confirm" :disabled="submitting" @tap="confirmBooking">{{ submitting ? '处理中…' : detail.price ? '确认支付并报名' : '确认免费报名' }}</button>
    </view></view>
  </view>
</template>

<style scoped>
.salon-page { min-height: 100vh; max-width: 540px; margin: auto; background: #f8f7f4; color: #171716; padding-bottom: calc(180rpx + env(safe-area-inset-bottom)); }
.topbar { position: relative; height: 108rpx; padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; }.brand { width: 90rpx; height: 30rpx; }.topbar > text { position: absolute; right: 36rpx; bottom: 40rpx; font-size: 19rpx; color: #8b8883; }.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; line-height: 72rpx; text-align: center; font-size: 54rpx; font-weight: 300; }
.cover { display: block; width: 100%; height: 520rpx; background: #e9e6e0; }.intro { padding: 44rpx 42rpx 36rpx; }.eyebrow { font-size: 17rpx; letter-spacing: 3rpx; color: #969189; }.title { display: block; margin-top: 24rpx; font-size: 40rpx; line-height: 1.5; font-weight: 300; letter-spacing: 3rpx; }.subtitle { display: block; margin-top: 18rpx; font-size: 22rpx; line-height: 1.7; color: #8b8883; }.tags { display: flex; gap: 16rpx; margin-top: 28rpx; flex-wrap: wrap; }.tags text { padding: 10rpx 18rpx; border: 1px solid #d7d2c9; font-size: 19rpx; }
.facts { margin: 0 42rpx; padding: 12rpx 0; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.facts > view { display: flex; gap: 24rpx; padding: 16rpx 0; font-size: 21rpx; line-height: 1.8; }.facts > view > text:first-child { flex-shrink: 0; color: #969189; }.section { padding: 48rpx 42rpx 0; }.section-title { display: block; margin-top: 16rpx; margin-bottom: 28rpx; font-size: 30rpx; font-weight: 400; letter-spacing: 2rpx; }.paragraph { display: block; margin-top: 22rpx; font-size: 24rpx; color: #77736c; line-height: 2; }.agenda { display: flex; gap: 32rpx; padding: 24rpx 0; border-bottom: 1px solid #e5e2dc; font-size: 23rpx; }.agenda text:first-child { color: #969189; }.tips { padding-bottom: 40rpx; }.tips .paragraph { font-size: 21rpx; }.success { margin: 20rpx 42rpx; padding: 28rpx; background: #e5ebe1; color: #5c7055; font-size: 23rpx; line-height: 1.8; }.success text { display: block; margin-top: 16rpx; }
.action-bar { position: fixed; z-index: 10; bottom: 0; left: 0; right: 0; max-width: 540px; box-sizing: border-box; margin: auto; padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom)); border-top: 1px solid #dedcd7; background: #f8f7f4; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }.price { display: block; font-size: 36rpx; font-weight: 300; }.price-tip { display: block; margin-top: 8rpx; font-size: 17rpx; color: #969189; }button { border-radius: 0; background: #171716; color: #fff; font-size: 23rpx; }button::after { border: 0; }button[disabled] { background: #dedbd4; color: #969189; }.action-bar button { margin: 0; min-width: 300rpx; height: 88rpx; line-height: 88rpx; padding: 0 24rpx; }.status { padding: 160rpx 42rpx; text-align: center; color: #969189; font-size: 24rpx; }
.mask { position: fixed; z-index: 30; inset: 0; display: flex; align-items: flex-end; justify-content: center; background: rgba(23,23,22,.5); }.sheet { width: 100%; max-width: 540px; box-sizing: border-box; padding: 36rpx 36rpx calc(36rpx + env(safe-area-inset-bottom)); background: #f8f7f4; }.sheet-heading { display: flex; align-items: center; justify-content: space-between; font-size: 30rpx; }.sheet-heading button { margin: 0; width: 72rpx; height: 72rpx; line-height: 72rpx; padding: 0; background: transparent; color: #77736c; font-size: 40rpx; }.sheet-title { display: block; margin-top: 28rpx; font-size: 27rpx; }.payment-row { display: flex; align-items: center; justify-content: space-between; padding: 30rpx 0; border-bottom: 1px solid #dedcd7; font-size: 24rpx; }.balance { display: block; margin-top: 12rpx; font-size: 20rpx; color: #969189; }.total { padding: 32rpx 0; display: flex; justify-content: space-between; font-size: 27rpx; }.confirm { height: 88rpx; line-height: 88rpx; }.free-note { display: block; padding: 30rpx 0; font-size: 23rpx; color: #77736c; }
</style>
