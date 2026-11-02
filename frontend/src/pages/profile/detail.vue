<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, onMounted, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { fetchConsumptionRecords, type ConsumptionRecord } from '../../api/profile'
import { fetchFavoriteCollections, setLookFavorite, setProductFavorite } from '../../api/works'
import type { FavoriteCollections } from '../../api/works'

const moduleId = ref('')
const moduleTitle = ref('个人信息')
const loading = ref(true)
const favorites = ref<FavoriteCollections>({ looks: [], products: [] })
const consumptionRecords = ref<ConsumptionRecord[]>([])
const categories = ['造型系列', '成衣', '手袋', '帽子', '眼镜', '配饰'] as const
const activeCategory = ref<typeof categories[number]>('造型系列')

function applyModuleId(id: string) {
  moduleId.value = id || 'profile'
  moduleTitle.value = moduleId.value === 'favorites' ? '我的收藏' : moduleId.value === 'archive' ? '消费档案' : '个人信息'
}

function syncH5ModuleId() {
  // #ifdef H5
  const hash = window.location.hash
  const queryString = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  applyModuleId(new URLSearchParams(queryString).get('id') ?? 'profile')
  // #endif
}

onLoad((query) => {
  applyModuleId(String(query?.id ?? 'profile'))
  loadPage()
})
onShow(() => {
  syncH5ModuleId()
  if (moduleId.value === 'favorites' || moduleId.value === 'archive') loadPage()
})

async function loadPage() {
  loading.value = true
  if (moduleId.value === 'favorites') favorites.value = await fetchFavoriteCollections()
  if (moduleId.value === 'archive') consumptionRecords.value = await fetchConsumptionRecords()
  loading.value = false
}

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const visibleItems = computed(() => {
  if (activeCategory.value === '造型系列') return favorites.value.looks
  return favorites.value.products.filter((item) => item.category === activeCategory.value)
})

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

function openFavorite(item: (typeof favorites.value.looks)[number] | (typeof favorites.value.products)[number]) {
  if ('series' in item) {
    navigate(`/pages/works/detail?series=${encodeURIComponent(item.series)}&code=${encodeURIComponent(item.code)}&from=favorites`)
    return
  }
  navigate(`/pages/works/product?id=${encodeURIComponent(item.id)}&from=favorites&returnTo=${encodeURIComponent('/pages/profile/detail?id=favorites')}`)
}

async function removeFavorite(item: (typeof favorites.value.looks)[number] | (typeof favorites.value.products)[number]) {
  if ('series' in item) await setLookFavorite(item.id, false)
  else await setProductFavorite(item.id, false)
  await loadPage()
}
</script>

<template>
  <view class="detail-page">
    <view class="topbar"><text class="back" @tap="goBack">‹</text><text class="topbar-title">{{ moduleTitle }}</text></view>
    <template v-if="moduleId === 'favorites'">
      <view class="intro"><text class="eyebrow">DAY+ / SAVED PIECES</text><text class="detail-title">我的收藏</text><text class="detail-note">收藏喜欢的造型搭配与单品。</text></view>
      <scroll-view class="category-scroll" scroll-x :show-scrollbar="false"><view class="category-list"><text v-for="category in categories" :key="category" :class="['category', { active: activeCategory === category }]" @tap="activeCategory = category">{{ category }}</text></view></scroll-view>
      <view class="collection-head"><view><text class="collection-kicker">DAY+ / {{ activeCategory === '造型系列' ? 'LOOKS' : 'PRODUCTS' }}</text><text class="collection-title">{{ activeCategory }}</text></view><text class="collection-count">{{ visibleItems.length.toString().padStart(2, '0') }} ITEMS</text></view>
      <view v-if="loading" class="status">正在加载收藏…</view>
      <view v-else-if="!visibleItems.length" class="status">暂无{{ activeCategory }}收藏</view>
      <view v-else class="favorite-grid">
        <view v-for="item in visibleItems" :key="item.id" class="favorite-card" @tap="openFavorite(item)">
          <view class="image-wrap"><image :src="item.image" mode="aspectFill" /></view>
          <view class="card-meta"><view><text class="card-code">{{ 'series' in item ? item.code : item.code }}</text><text class="card-name">{{ 'series' in item ? item.name : item.name }}</text><text v-if="!('series' in item)" class="card-price">¥ {{ item.price.toLocaleString('en-US') }}</text></view><button class="remove" @tap.stop="removeFavorite(item)">×</button></view>
        </view>
      </view>
    </template>
    <template v-else-if="moduleId === 'archive'">
      <view class="intro"><text class="eyebrow">DAY+ / PURCHASE ARCHIVE</text><text class="detail-title">消费档案</text><text class="detail-note">记录您在 DAY+ 实体店的每一次选择。</text></view>
      <view v-if="loading" class="status">正在加载消费记录…</view>
      <view v-else-if="!consumptionRecords.length" class="status">暂无消费记录</view>
      <view v-else class="archive-list">
        <view v-for="record in consumptionRecords" :key="record.id" class="archive-card">
          <view class="archive-head"><view><text class="archive-date">{{ formatDate(record.purchasedAt) }}</text><text class="archive-store">{{ record.store }}</text></view><view class="archive-total"><text class="archive-total-label">消费金额</text><text class="archive-amount">¥ {{ money(record.amount) }}</text></view></view>
          <view class="archive-items"><view v-for="item in record.items" :key="`${record.id}-${item.name}`" class="archive-item"><view class="archive-item-copy"><text class="archive-item-name">{{ item.name }}</text><text class="archive-item-meta">{{ item.color }}　·　{{ item.size }}　·　×{{ item.quantity }}</text></view><text class="archive-item-price">¥ {{ money(item.price * item.quantity) }}</text></view></view>
        </view>
      </view>
    </template>
    <view v-else-if="!loading" class="empty-detail"><text class="eyebrow">DAY+ / {{ moduleId.toUpperCase() }}</text><text class="detail-title">{{ moduleTitle }}</text><text class="detail-note">功能页面正在准备中</text></view>
    <view v-else class="status">正在加载…</view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.detail-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 60rpx; background: #f8f7f4; color: #171716; }.topbar { height: 108rpx; padding: 0 30rpx; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 1px solid #e5e2dc; }.back { position: absolute; left: 30rpx; font-size: 60rpx; line-height: 1; font-weight: 200; transform: translateY(-4rpx); }.topbar-title { font-size: 28rpx; letter-spacing: 3rpx; }.intro { padding: 58rpx 42rpx 42rpx; }.eyebrow, .collection-kicker { color: #969189; font-size: 17rpx; letter-spacing: 3rpx; }.detail-title { display: block; margin-top: 22rpx; font-size: 42rpx; font-weight: 300; letter-spacing: 3rpx; }.detail-note { display: block; margin-top: 18rpx; color: #8c8881; font-size: 20rpx; }.category-scroll { width: 100%; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.category-list { display: inline-flex; padding: 25rpx 42rpx 23rpx; gap: 42rpx; white-space: nowrap; }.category { position: relative; color: #9b968e; font-size: 21rpx; letter-spacing: 2rpx; }.category.active { color: #171716; }.category.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -24rpx; height: 3rpx; background: #171716; }.collection-head { padding: 46rpx 42rpx 28rpx; display: flex; align-items: flex-end; justify-content: space-between; }.collection-title { display: block; margin-top: 10rpx; font-size: 30rpx; letter-spacing: 2rpx; }.collection-count { color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }.favorite-grid { padding: 0 42rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 38rpx 20rpx; }.image-wrap { height: 310rpx; overflow: hidden; background: #ebe8e2; }.image-wrap image { width: 100%; height: 100%; }.card-meta { padding-top: 16rpx; display: flex; justify-content: space-between; gap: 10rpx; }.card-code, .card-name, .card-price { display: block; }.card-code { color: #77736d; font-size: 17rpx; letter-spacing: 1rpx; }.card-name { margin-top: 8rpx; font-size: 20rpx; line-height: 1.4; }.card-price { margin-top: 10rpx; font-size: 19rpx; }.remove { flex: none; width: 42rpx; height: 42rpx; margin: -8rpx 0 0; padding: 0; background: transparent; color: #77736d; font-size: 32rpx; line-height: 42rpx; }.remove::after { border: 0; }.status { min-height: 300rpx; display: flex; align-items: center; justify-content: center; color: #8c8881; font-size: 21rpx; }.archive-list { padding: 0 30rpx; }.archive-card { margin-bottom: 24rpx; padding: 30rpx; border: 1px solid #dedcd7; background: #fdfcf9; }.archive-head { display: flex; justify-content: space-between; gap: 20rpx; padding-bottom: 26rpx; border-bottom: 1px solid #e5e2dc; }.archive-date, .archive-store, .archive-total-label, .archive-amount { display: block; }.archive-date { color: #77736d; font-size: 18rpx; letter-spacing: 1rpx; }.archive-store { margin-top: 12rpx; font-size: 22rpx; }.archive-total { text-align: right; flex-shrink: 0; }.archive-total-label { color: #969189; font-size: 16rpx; }.archive-amount { margin-top: 9rpx; font-size: 25rpx; }.archive-item { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 24rpx 0 4rpx; }.archive-item-copy { min-width: 0; }.archive-item-name, .archive-item-meta { display: block; }.archive-item-name { font-size: 21rpx; line-height: 1.5; }.archive-item-meta { margin-top: 8rpx; color: #969189; font-size: 17rpx; }.archive-item-price { flex-shrink: 0; color: #77736d; font-size: 18rpx; }.empty-detail { min-height: 62vh; padding: 120rpx 42rpx; display: flex; flex-direction: column; justify-content: center; }
</style>
