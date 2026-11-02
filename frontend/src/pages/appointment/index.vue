<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { fetchAppointmentCategories, fetchAppointmentReminder, fetchAppointmentShops, fetchAppointmentSlots, fetchStylists, submitAppointment } from '../../api/appointment'
import type { AppointmentCategory, Stylist } from '../../data/appointment'

const categories = ref<AppointmentCategory[]>([])
const slots = ref<string[]>([])
const stylists = ref<Stylist[]>([])
const reminder = ref({ title: '', paragraphs: [] as string[] })
const activeCategory = ref('')
const genderPreference = ref<'全部' | '男' | '女'>('全部')
const selectedStylist = ref('')
const selectedShop = ref('')
const selectedDate = ref('')
const selectedSlot = ref('')
const note = ref('')
const loading = ref(true)
const submitting = ref(false)
const notice = ref('')

const now = ref(Date.now())
const today = computed(() => {
  const date = new Date(now.value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

function isSlotAvailable(slot: string, timestamp = now.value) {
  if (!selectedDate.value || selectedDate.value < today.value) return false
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  const [hour, minute] = slot.split(':').map(Number)
  const earliestTime = timestamp + (selectedDate.value === today.value ? 2 * 60 * 60 * 1000 : 0)
  return new Date(year, month - 1, day, hour, minute).getTime() >= earliestTime
}

const canSubmit = computed(() => Boolean(activeCategory.value && selectedShop.value && selectedStylist.value && selectedSlot.value && isSlotAvailable(selectedSlot.value)))
const hasAvailableSlots = computed(() => slots.value.some((slot) => isSlotAvailable(slot)))

function refreshTime() {
  now.value = Date.now()
  if (selectedDate.value && selectedDate.value < today.value) selectedDate.value = ''
  if (selectedSlot.value && !isSlotAvailable(selectedSlot.value)) selectedSlot.value = ''
}

let clock: ReturnType<typeof setInterval> | undefined
function stopClock() {
  if (clock !== undefined) clearInterval(clock)
  clock = undefined
}
onShow(() => {
  refreshTime()
  stopClock()
  clock = setInterval(refreshTime, 1000)
})
onHide(stopClock)
onUnload(stopClock)
watch(selectedDate, () => {
  selectedSlot.value = ''
  refreshTime()
})

function selectSlot(slot: string) {
  refreshTime()
  if (isSlotAvailable(slot)) selectedSlot.value = slot
}

onMounted(async () => {
  const [categoryList, shopList, slotList, stylistList, reminderData] = await Promise.all([
    fetchAppointmentCategories(), fetchAppointmentShops(), fetchAppointmentSlots(), fetchStylists('全部'), fetchAppointmentReminder()
  ])
  categories.value = categoryList
  slots.value = slotList
  stylists.value = stylistList
  reminder.value = reminderData
  activeCategory.value = categoryList[0]?.id ?? ''
  selectedShop.value = shopList[0] ?? ''
  loading.value = false
})

async function changeGender(gender: '全部' | '男' | '女') {
  genderPreference.value = gender
  selectedStylist.value = ''
  stylists.value = await fetchStylists(gender)
}

function chooseStylist(stylist: Stylist) {
  if (stylist.available) selectedStylist.value = stylist.id
}

function notify(text: string) {
  notice.value = text
  setTimeout(() => { notice.value = '' }, 1800)
}

async function confirmAppointment() {
  refreshTime()
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  await submitAppointment({ category: activeCategory.value, shop: selectedShop.value, date: selectedDate.value, slot: selectedSlot.value, stylist: selectedStylist.value, note: note.value })
  submitting.value = false
  notify('预约申请已提交，顾问将与您确认详情')
  setTimeout(goBack, 1800)
}

function goBack() {
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#/pages/service/index`)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}
</script>

<template>
  <view class="appointment-page">
    <view class="topbar">
      <text class="back" @tap="goBack">‹</text>
      
      <text class="topbar-title">我的预约服务</text>
    
    </view>

    <view v-if="loading" class="loading">正在加载服务信息…</view>
    <template v-else>
      <view class="section category-section">
        <text class="section-title">选择服务类型</text>
        <view class="category-list">
          <view v-for="category in categories" :key="category.id" :class="['category-card', { active: activeCategory === category.id }]" @tap="activeCategory = category.id">
            <view class="category-head"><text class="category-name">{{ category.name }}</text><text v-if="activeCategory === category.id" class="check">✓</text></view>
            <text class="category-desc">{{ category.description }}</text>
            <view class="category-meta"><text>{{ category.duration }}</text><text>{{ category.price }}</text></view>
          </view>
        </view>
      </view>

      <view class="section staff-section">
        <text class="section-title">选择服务人员</text>
        <view class="preference-row"><text class="field-label">服务人员偏好</text><view class="gender-tabs"><text v-for="gender in ['全部', '男', '女']" :key="gender" :class="['gender-tab', { active: genderPreference === gender }]" @tap="changeGender(gender as '全部' | '男' | '女')">{{ gender }}</text></view></view>
        <scroll-view scroll-x class="staff-scroll" :show-scrollbar="false">
          <view v-for="stylist in stylists" :key="stylist.id" :class="['staff-card', { selected: selectedStylist === stylist.id }]" @tap="chooseStylist(stylist)">
            <view class="avatar-wrap"><image :src="stylist.avatar" mode="aspectFill" /><text v-if="selectedStylist === stylist.id" class="avatar-check">✓</text></view>
            <text class="staff-name">{{ stylist.name }}</text><text class="staff-title">{{ stylist.title }}</text><text class="staff-specialty">{{ stylist.specialty }}</text>
            <text class="staff-rating">★ {{ stylist.rating }}</text>
          </view>
        </scroll-view>
        <text v-if="!stylists.length" class="empty">暂无符合偏好的服务人员</text>
      </view>

      <view class="section form-section">
        <text class="section-title">选择预约时间</text>
        <picker mode="date" :start="today" :value="selectedDate || today" @tap="refreshTime" @change="selectedDate = $event.detail.value"><view class="picker-line"><text :class="{ placeholder: !selectedDate }">{{ selectedDate || '日期*' }}</text><view class="calendar-icon"><view class="calendar-divider" /><view class="calendar-dot" /></view></view></picker>
        <text class="time-hint">预约需提前 24 小时，灰色时段不可选</text>
        <view class="slot-grid"><text v-for="slot in slots" :key="slot" :class="['slot', { active: selectedSlot === slot, disabled: !isSlotAvailable(slot) }]" @tap="selectSlot(slot)">{{ slot }}</text></view>
        <text v-if="selectedDate && !hasAvailableSlots" class="time-hint">该日期暂无可预约时段，请选择其他日期</text>
      </view>

      <view class="section note-section"><text class="section-title">备注</text><textarea v-model="note" maxlength="200" placeholder="请描述您的具体需求（如若需要）" /><text class="counter">{{ note.length }}/200字</text></view>
      <view class="reminder"><text class="reminder-title">{{ reminder.title }}</text><text v-for="paragraph in reminder.paragraphs" :key="paragraph" class="reminder-text">{{ paragraph }}</text></view>
      <view class="submit-wrap"><button :disabled="!canSubmit || submitting" :class="{ enabled: canSubmit && !submitting }" @tap="confirmAppointment">{{ submitting ? '提交中…' : '确认预约' }}</button></view>
    </template>
    <view v-if="notice" class="notice">{{ notice }}</view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.appointment-page { min-height: 100vh; max-width: 540px; margin: 0 auto; background: #fff; color: #171716; padding-bottom: 38rpx; }
.topbar { height: 108rpx; padding: 0 30rpx; display: flex; align-items: center; position: relative; border-bottom: 1px solid #e8e8e8; }
.back { font-size: 60rpx; line-height: 1; font-weight: 200; transform: translateY(-4rpx); }
.home-mark { margin-left: 28rpx; font-size: 48rpx; line-height: 1; font-weight: 300;display:none; }
.topbar-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 31rpx; font-weight: 500; white-space: nowrap; }
.topbar-menu { margin-left: auto; width: 214rpx; height: 74rpx; border: 1px solid #e6e6e6; border-radius: 40rpx; display: flex; justify-content: space-evenly; align-items: center; font-size: 34rpx; letter-spacing: 0; }
.topbar-menu i { height: 40rpx; border-left: 1px solid #e2e2e2; }
.section { padding: 52rpx 30rpx 0; }
.section-title { display: block; font-size: 33rpx; font-weight: 600; }
.category-list { margin-top: 35rpx; display: flex; flex-direction: column; gap: 18rpx; }
.category-card { padding: 28rpx 26rpx 24rpx; border: 1px solid #dedede; background: #fff; }
.category-card.active { border-color: #171716; box-shadow: inset 4rpx 0 #171716; }
.category-head, .category-meta, .preference-row, .picker-line { display: flex; align-items: center; justify-content: space-between; }
.category-name { font-size: 27rpx; font-weight: 500; }.check { font-size: 28rpx; }.category-desc { display: block; margin-top: 12rpx; color: #777; font-size: 22rpx; }.category-meta { margin-top: 20rpx; color: #999; font-size: 19rpx; }
.preference-row { margin-top: 30rpx; padding-bottom: 20rpx; border-bottom: 1px solid #ededed; }.field-label { color: #555; font-size: 22rpx; }.gender-tabs { display: flex; gap: 10rpx; }.gender-tab { padding: 10rpx 23rpx; border: 1px solid #dedede; color: #777; font-size: 21rpx; }.gender-tab.active { background: #171716; color: #fff; border-color: #171716; }
.staff-scroll { width: calc(100% + 30rpx); margin-top: 26rpx; white-space: nowrap; }.staff-card { width: 190rpx; min-height: 300rpx; margin-right: 14rpx; padding: 20rpx 14rpx; display: inline-flex; vertical-align: top; flex-direction: column; align-items: center; border: 1px solid #e2e2e2; }.staff-card.selected { border-color: #171716; }.avatar-wrap { position: relative; width: 112rpx; height: 112rpx; }.avatar-wrap image { width: 100%; height: 100%; border-radius: 50%; filter: grayscale(25%); }.avatar-check { position: absolute; right: -4rpx; bottom: 0; width: 30rpx; height: 30rpx; border-radius: 50%; background: #171716; color: #fff; text-align: center; line-height: 30rpx; font-size: 19rpx; }.staff-name { margin-top: 16rpx; font-size: 24rpx; }.staff-title { margin-top: 8rpx; color: #555; font-size: 18rpx; }.staff-specialty { margin-top: 8rpx; color: #999; font-size: 16rpx; text-align: center; white-space: normal; }.staff-rating { margin-top: auto; color: #666; font-size: 18rpx; }.empty, .loading { display: block; padding: 40rpx 0; color: #999; font-size: 22rpx; }
.form-section { padding-top: 55rpx; }.picker-line { height: 94rpx; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 24rpx; }.picker-line .placeholder { color: #c9c9c9; }.slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; padding-top: 22rpx; }.slot { padding: 17rpx 0; border: 1px solid #e5e5e5; text-align: center; color: #777; font-size: 21rpx; }.slot.active { background: #171716; border-color: #171716; color: #fff; }
.calendar-icon { position: relative; flex-shrink: 0; width: 32rpx; height: 30rpx; margin: 6rpx 4rpx 0; border: 2rpx solid #171716; border-radius: 3rpx; }
.calendar-icon::before, .calendar-icon::after { content: ''; position: absolute; top: -7rpx; width: 2rpx; height: 10rpx; background: #171716; }
.calendar-icon::before { left: 7rpx; }.calendar-icon::after { right: 7rpx; }
.calendar-divider { position: absolute; left: 0; right: 0; top: 7rpx; border-top: 2rpx solid #171716; }
.calendar-dot { position: absolute; left: 7rpx; top: 15rpx; width: 4rpx; height: 4rpx; background: #171716; }
.time-hint { display: block; margin-top: 18rpx; color: #999; font-size: 20rpx; line-height: 1.6; }
.slot.disabled { background: #f7f7f7; border-color: #eee; color: #c9c9c9; cursor: not-allowed; }
.note-section { padding-top: 62rpx; position: relative; }.note-section textarea { width: 100%; height: 150rpx; margin-top: 30rpx; padding: 18rpx 0; border-bottom: 1px solid #ddd; font-size: 23rpx; }.counter { position: absolute; right: 30rpx; bottom: 14rpx; color: #aaa; font-size: 18rpx; }.reminder { margin-top: 56rpx; padding: 52rpx 30rpx 30rpx; background: #fafafa; border-top: 1px solid #f0f0f0; }.reminder-title { display: block; font-size: 28rpx; font-weight: 600; }.reminder-text { display: block; margin-top: 30rpx; color: #555; font-size: 21rpx; line-height: 1.9; }.submit-wrap { padding: 30rpx; border-top: 1px solid #eee; }.submit-wrap button { height: 86rpx; border: 1px solid #d7d7d7; border-radius: 0; color: #c9c9c9; font-size: 25rpx; }.submit-wrap button.enabled { background: #171716; border-color: #171716; color: #fff; }.notice { position: fixed; z-index: 20; left: 50%; bottom: 80rpx; transform: translateX(-50%); padding: 22rpx 30rpx; background: rgba(23,23,22,.92); color: #fff; font-size: 21rpx; white-space: nowrap; }
</style>
