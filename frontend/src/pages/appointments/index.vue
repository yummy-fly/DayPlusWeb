<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { cancelAppointment, fetchAppointments } from '../../api/appointment'
import type { AppointmentRecord, AppointmentStatus } from '../../api/appointment'

const appointments = ref<AppointmentRecord[]>([])
const activeStatus = ref<AppointmentStatus>('confirmed')
const selected = ref<AppointmentRecord | null>(null)
const loading = ref(true)
const failed = ref(false)
const cancelling = ref(false)
const tabs: Array<{ key: AppointmentStatus; label: string }> = [
  { key: 'confirmed', label: '已确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
]
const visibleAppointments = computed(() => appointments.value.filter((item) => item.status === activeStatus.value))

onLoad(loadPage)
onShow(loadPage)

async function loadPage() {
  loading.value = true
  failed.value = false
  try {
    appointments.value = await fetchAppointments()
    if (selected.value) selected.value = appointments.value.find((item) => item.id === selected.value?.id) ?? null
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
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

function openAppointment(item: AppointmentRecord) {
  selected.value = item
}

async function cancelSelected() {
  if (!selected.value || selected.value.status !== 'confirmed' || cancelling.value) return
  cancelling.value = true
  try {
    await cancelAppointment(selected.value.id)
    selected.value = { ...selected.value, status: 'cancelled' }
    appointments.value = appointments.value.map((item) => item.id === selected.value?.id ? { ...item, status: 'cancelled' } : item)
    activeStatus.value = 'cancelled'
    uni.showToast({ title: '预约已取消', icon: 'success' })
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <view class="appointments-page">
    <view class="topbar"><view class="back" @tap="goBack"><view class="back-arrow" /></view><text>我的预约</text></view>
    <view class="intro"><text class="eyebrow">DAY+ / MY APPOINTMENTS</text><text class="title">我的预约</text><text class="note">查看预约服务、到店时间与专属顾问。</text></view>
    <view class="tabs"><button v-for="tab in tabs" :key="tab.key" :class="['tab', { active: activeStatus === tab.key }]" @tap="activeStatus = tab.key">{{ tab.label }}<text>{{ appointments.filter((item) => item.status === tab.key).length }}</text></button></view>
    <view v-if="loading" class="status">正在加载预约记录…</view>
    <view v-else-if="failed" class="status"><text>加载失败，请稍后重试</text><button class="retry" @tap="loadPage">重新加载</button></view>
    <view v-else-if="!visibleAppointments.length" class="status">暂无{{ tabs.find((tab) => tab.key === activeStatus)?.label }}预约</view>
    <view v-else class="appointment-list">
      <view v-for="item in visibleAppointments" :key="item.id" class="appointment-card" @tap="openAppointment(item)">
        <view class="card-head"><text class="card-kicker">DAY+ / APPOINTMENT</text><text :class="['status-tag', item.status]">{{ tabs.find((tab) => tab.key === item.status)?.label }}</text></view>
        <text class="service-name">{{ item.categoryName }}</text>
        <view class="date-line"><text class="date">{{ formatDate(item.date) }}</text><text class="slot">{{ item.slot }}</text></view>
        <view class="card-foot"><text>{{ item.shop }}</text><text>{{ item.stylistName }} 顾问　›</text></view>
      </view>
    </view>
    <view v-if="selected" class="detail-mask" @tap="selected = null"><view class="detail-sheet" @tap.stop>
      <view class="sheet-head"><view><text class="eyebrow">DAY+ / APPOINTMENT DETAIL</text><text class="sheet-title">预约详情</text></view><text class="close" @tap="selected = null">×</text></view>
      <view class="detail-status"><text>预约状态</text><text :class="['status-tag', selected.status]">{{ tabs.find((tab) => tab.key === selected?.status)?.label }}</text></view>
      <view class="detail-list"><view><text>服务项目</text><strong>{{ selected.categoryName }}</strong></view><view><text>预约时间</text><strong>{{ formatDate(selected.date) }}　{{ selected.slot }}</strong></view><view><text>服务门店</text><strong>{{ selected.shop }}</strong></view><view><text>服务顾问</text><strong>{{ selected.stylistName }}</strong></view><view v-if="selected.note"><text>备注</text><strong>{{ selected.note }}</strong></view></view>
      <button v-if="selected.status === 'confirmed'" class="cancel-button" :disabled="cancelling" @tap="cancelSelected">{{ cancelling ? '取消中…' : '取消预约' }}</button>
    </view></view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.appointments-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 60rpx; background: #f8f7f4; color: #171716; }.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 5rpx; }.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }.intro { padding: 58rpx 36rpx 42rpx; }.eyebrow { color: #969189; font-size: 17rpx; letter-spacing: 3rpx; }.title { display: block; margin-top: 20rpx; font-size: 42rpx; font-weight: 300; letter-spacing: 3rpx; }.note { display: block; margin-top: 16rpx; color: #8c8881; font-size: 20rpx; }.tabs { display: flex; padding: 0 36rpx; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.tab { flex: 1; margin: 0; padding: 25rpx 0 22rpx; border-radius: 0; background: transparent; color: #969189; font-size: 20rpx; }.tab::after { border: 0; }.tab text { margin-left: 8rpx; font-size: 16rpx; }.tab.active { color: #171716; border-bottom: 3rpx solid #171716; }.appointment-list { padding: 32rpx 30rpx; display: flex; flex-direction: column; gap: 22rpx; }.appointment-card { padding: 26rpx; border: 1px solid #dedcd7; background: #fdfcf9; }.card-head, .date-line, .card-foot, .detail-status, .sheet-head { display: flex; align-items: center; justify-content: space-between; }.card-kicker { color: #969189; font-size: 16rpx; letter-spacing: 2rpx; }.status-tag { padding: 8rpx 14rpx; font-size: 16rpx; }.status-tag.confirmed { background: #e5ebe1; color: #5c7055; }.status-tag.completed { background: #e8e5df; color: #77736c; }.status-tag.cancelled { background: #eee4e1; color: #9a6c63; }.service-name { display: block; margin-top: 30rpx; font-size: 28rpx; letter-spacing: 1rpx; }.date-line { margin-top: 24rpx; justify-content: flex-start; gap: 22rpx; }.date { font-size: 32rpx; font-weight: 300; }.slot { color: #77736c; font-size: 21rpx; }.card-foot { margin-top: 26rpx; padding-top: 18rpx; border-top: 1px solid #e6e2dc; color: #77736c; font-size: 17rpx; }.status { min-height: 320rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22rpx; color: #8b8883; font-size: 21rpx; }.retry { padding: 0 30rpx; border-radius: 0; background: #171716; color: #fff; font-size: 22rpx; }.retry::after { border: 0; }.detail-mask { position: fixed; z-index: 30; inset: 0; display: flex; align-items: flex-end; background: rgba(23,23,22,.38); }.detail-sheet { width: 100%; max-width: 540px; box-sizing: border-box; padding: 42rpx 36rpx calc(42rpx + env(safe-area-inset-bottom)); background: #f8f7f4; }.sheet-title { display: block; margin-top: 16rpx; font-size: 34rpx; }.close { font-size: 42rpx; color: #77736c; }.detail-status { margin-top: 36rpx; padding-bottom: 22rpx; border-bottom: 1px solid #dedcd7; color: #77736c; font-size: 19rpx; }.detail-list view { padding: 22rpx 0; display: flex; flex-direction: column; gap: 9rpx; border-bottom: 1px solid #e5e2dc; }.detail-list text { color: #969189; font-size: 17rpx; }.detail-list strong { font-size: 21rpx; font-weight: 400; }.cancel-button { height: 78rpx; margin-top: 32rpx; border-radius: 0; background: #171716; color: #fff; font-size: 22rpx; }.cancel-button::after { border: 0; }
</style>
