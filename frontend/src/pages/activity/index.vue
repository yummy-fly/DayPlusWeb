<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchActivities } from '../../api/activity'
import type { ActivitySummary, ActivityType } from '../../data/activity'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const selectedDate = ref('')
const activities = ref<ActivitySummary[]>([])
const loading = ref(false)
const failed = ref(false)
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const types: ActivityType[] = ['店内活动', '沙龙', '主题活动']
const monthKey = computed(() => `${year.value}-${String(month.value + 1).padStart(2, '0')}`)
const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const activityDates = computed(() => new Set(activities.value.map((item) => item.date)))
const days = computed(() => {
  const offset = (new Date(year.value, month.value, 1).getDay() + 6) % 7
  const count = new Date(year.value, month.value + 1, 0).getDate()
  const length = Math.ceil((offset + count) / 7) * 7
  return Array.from({ length }, (_, index) => {
    const day = index - offset + 1
    return day > 0 && day <= count ? { day, date: `${monthKey.value}-${String(day).padStart(2, '0')}` } : null
  })
})
const selectedLabel = computed(() => selectedDate.value ? `${Number(selectedDate.value.slice(5, 7))}月${Number(selectedDate.value.slice(8))}日` : '')
const groups = computed(() => types.map((type) => ({ type, items: activities.value.filter((item) => item.date === selectedDate.value && item.type === type).sort((a, b) => a.startTime.localeCompare(b.startTime)) })).filter((group) => group.items.length))
let requestId = 0

onLoad(() => loadActivities())

async function loadActivities() {
  const currentRequest = ++requestId
  loading.value = true
  failed.value = false
  activities.value = []
  try {
    const result = await fetchActivities(monthKey.value)
    if (currentRequest !== requestId) return
    activities.value = result
    const dates = [...new Set(result.map((item) => item.date))].sort()
    if (!selectedDate.value.startsWith(`${monthKey.value}-`)) {
      selectedDate.value = dates.find((date) => date >= todayKey) ?? dates[0] ?? `${monthKey.value}-01`
    }
  } catch {
    if (currentRequest === requestId) failed.value = true
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

function changeMonth(step: number) {
  const next = new Date(year.value, month.value + step, 1)
  year.value = next.getFullYear()
  month.value = next.getMonth()
  selectedDate.value = ''
  loadActivities()
}

function openActivity(id: string) {
  const path = `/pages/activity/detail?id=${encodeURIComponent(id)}`
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
  else window.location.assign(`${window.location.pathname}#/pages/service/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/service/index' })
  // #endif
}
</script>

<template>
  <view class="calendar-page">
    <view class="topbar">
      <view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view>
      <text>活动日历</text>
    </view>
    <view class="calendar-section">
      <text class="eyebrow">DAY+ / EVENT CALENDAR</text>
      <view class="month-heading">
        <text class="month-title">{{ year }}年 {{ String(month + 1).padStart(2, '0') }}月</text>
        <view class="month-controls">
          <button class="month-button" aria-label="上个月" @tap="changeMonth(-1)"><view class="chevron previous" /></button>
          <button class="month-button" aria-label="下个月" @tap="changeMonth(1)"><view class="chevron" /></button>
        </view>
      </view>
      <view class="calendar-grid week-row"><text v-for="day in weekdays" :key="day">{{ day }}</text></view>
      <view class="calendar-grid">
        <view v-for="(cell, index) in days" :key="index" class="day-cell">
          <button v-if="cell" :class="['day-button', { selected: selectedDate === cell.date, today: todayKey === cell.date }]" :aria-label="`${cell.date}${activityDates.has(cell.date) ? '，有活动' : ''}`" :aria-pressed="selectedDate === cell.date" @tap="selectedDate = cell.date">
            <text>{{ cell.day }}</text>
            <view v-if="activityDates.has(cell.date)" class="activity-dot" />
          </button>
        </view>
      </view>
      <view class="calendar-note"><view class="legend-dot" /><text>当日有活动</text><text class="today-note">细线标记为今天</text></view>
    </view>
    <view class="events-section">
      <view class="section-heading"><text class="section-title">{{ selectedLabel || '本月' }}的活动</text><text class="eyebrow">DAILY EVENTS</text></view>
      <view v-if="loading" class="status">正在加载活动…</view>
      <view v-else-if="failed" class="status"><text>活动加载失败</text><button class="retry" @tap="loadActivities">重新加载</button></view>
      <template v-else-if="groups.length">
        <view v-for="group in groups" :key="group.type" class="event-group">
          <text class="group-title">{{ group.type }}</text>
          <view v-for="activity in group.items" :key="activity.id" class="event-card" role="button" :aria-label="activity.name" @tap="openActivity(activity.id)">
            <text class="event-name">{{ activity.name }}</text>
            <text class="event-time">{{ activity.date.replace(/-/g, '.') }} · {{ activity.startTime }} — {{ activity.endTime }}</text>
          </view>
        </view>
      </template>
      <view v-else class="status"><text>{{ activities.length ? '当日暂无活动' : '本月暂无活动安排' }}</text><text class="empty-hint">{{ activities.length ? '选择带圆点的日期，查看活动安排' : '可切换月份，查看其他活动' }}</text></view>
    </view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.calendar-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: calc(60rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 5rpx; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }
.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }
.calendar-section { padding: 48rpx 36rpx 30rpx; border-bottom: 1px solid #dedcd7; }
.eyebrow { color: #8b8883; font-size: 17rpx; letter-spacing: 3rpx; }
.month-heading { margin: 24rpx 6rpx 30rpx; display: flex; align-items: center; justify-content: space-between; }
.month-title { font-size: 36rpx; font-weight: 300; letter-spacing: 3rpx; }
.month-controls { display: flex; gap: 12rpx; }
.month-button { width: 64rpx; height: 64rpx; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid #dedcd7; border-radius: 0; background: transparent; }
.month-button::after, .day-button::after { border: none; }
.chevron { width: 13rpx; height: 13rpx; border-top: 1px solid #171716; border-right: 1px solid #171716; transform: rotate(45deg); }
.chevron.previous { transform: rotate(-135deg); }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.week-row { padding-bottom: 18rpx; color: #969189; font-size: 21rpx; text-align: center; }
.day-cell { height: 88rpx; display: flex; align-items: center; justify-content: center; }
.day-button { position: relative; width: 70rpx; height: 76rpx; margin: 0; padding: 0 0 10rpx; border: 1px solid transparent; border-radius: 0; background: transparent; line-height: 1; display: flex; align-items: center; justify-content: center; font-size: 25rpx; font-weight: 300; }
.day-button.today { border-color: #b8b1a7; }
.day-button.selected { background: #171716; color: #fff; border-color: #171716; }
.activity-dot { position: absolute; bottom: 10rpx; left: calc(50% - 3rpx); width: 6rpx; height: 6rpx; background: #171716; border-radius: 50%; }
.selected .activity-dot { background: #fff; }
.calendar-note { margin: 24rpx 6rpx 0; display: flex; align-items: center; gap: 12rpx; color: #969189; font-size: 19rpx; }
.legend-dot { width: 6rpx; height: 6rpx; border-radius: 50%; background: #171716; }
.today-note { margin-left: auto; }
.events-section { padding: 42rpx; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.section-title { font-size: 29rpx; font-weight: 300; letter-spacing: 2rpx; }
.event-group { margin-top: 36rpx; }
.group-title { display: block; margin-bottom: 18rpx; font-size: 20rpx; color: #8b8883; letter-spacing: 3rpx; }
.event-card { margin-top: 16rpx; padding: 30rpx 26rpx; border: 1px solid #dedcd7; background: #fdfcf9; }
.event-card:active { background: #ebe7df; }
.event-name { display: block; font-size: 27rpx; line-height: 1.6; font-weight: 300; letter-spacing: 2rpx; }
.event-time { display: block; margin-top: 18rpx; color: #8b8883; font-size: 21rpx; line-height: 1.6; letter-spacing: 1rpx; }
.status { min-height: 210rpx; padding: 42rpx 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; font-size: 24rpx; color: #8b8883; text-align: center; }
.empty-hint { font-size: 20rpx; color: #a09b93; }
.retry { padding: 0 32rpx; border-radius: 0; background: #171716; color: #fff; font-size: 23rpx; }
@media (min-width: 700px) { .calendar-page { box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
