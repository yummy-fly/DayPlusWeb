<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchWorkCollections, isLookFavorite, isProductFavorite, setLookFavorite, setProductFavorite } from '../../api/works'
import { productDetails, workProductIds } from '../../data/works'
import type { WorkCollections, WorkItem } from '../../data/works'

const categories = ['造型系列', '成衣', '手袋', '帽子', '眼镜', '配饰']
const seriesOptions = ['2026秋冬系列', '2026秋季系列', '2026夏季系列', '2026春季系列']
const activeCategory = ref('造型系列')

onLoad((query) => {
  const category = String(query?.category ?? '')
  if (categories.includes(category)) activeCategory.value = category
})
const selectedSeries = ref('2026秋冬系列')
const draftSeries = ref('')
const showFilter = ref(false)

const icons = {
  home: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z"/><path d="M9.5 21.5v-7h5v7"/></svg>'),
  works: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4.5a2 2 0 1 1 2 2V8"/><path d="M12 8l9.2 6.4a1.4 1.4 0 0 1-.8 2.6H3.6a1.4 1.4 0 0 1-.8-2.6L12 8z"/></svg>'),
  service: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'),
  mine: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/></svg>'),
  star: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'),
  starFilled: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#171716" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>')
}

const navItems = [
  { key: 'home', label: '首页', icon: icons.home },
  { key: 'works', label: '作品', icon: icons.works },
  { key: 'service', label: '服务', icon: icons.service },
  { key: 'mine', label: '我的', icon: icons.mine }
]

const collections = ref<WorkCollections>({})
const favoriteIds = ref(new Set<string>())
const savingFavorites = ref(new Set<string>())

onMounted(async () => {
  collections.value = await fetchWorkCollections()
  const ids = new Set<string>()
  Object.entries(collections.value).forEach(([key, items]) => items.forEach((item) => {
    const id = key.endsWith('系列') ? `${key}:${item.code}` : workProductIds[item.name]
    if (id && (key.endsWith('系列') ? isLookFavorite(id) : isProductFavorite(id))) ids.add(id)
  }))
  favoriteIds.value = ids
})

const activeItems = computed(() => collections.value[activeCategory.value === '造型系列' ? selectedSeries.value : activeCategory.value] ?? [])

function openWork(item: WorkItem) {
  const id = workProductIds[item.name]
  if (activeCategory.value !== '造型系列' && !id) {
    uni.showToast({ title: '该单品详情暂不可用', icon: 'none' })
    return
  }
  const path = activeCategory.value === '造型系列'
    ? `/pages/works/detail?series=${encodeURIComponent(selectedSeries.value)}&code=${encodeURIComponent(item.code)}&from=works`
    : `/pages/works/product?id=${encodeURIComponent(id)}&from=works&returnTo=${encodeURIComponent(`/pages/works/index?category=${encodeURIComponent(activeCategory.value)}`)}`
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

function favoriteId(item: WorkItem) {
  return activeCategory.value === '造型系列' ? `${selectedSeries.value}:${item.code}` : workProductIds[item.name]
}

function isFavorite(item: WorkItem) {
  const id = favoriteId(item)
  return !!id && favoriteIds.value.has(id)
}

async function toggleFavorite(item: WorkItem) {
  const id = favoriteId(item)
  if (!id || savingFavorites.value.has(id)) return
  const favorite = !favoriteIds.value.has(id)
  savingFavorites.value = new Set(savingFavorites.value).add(id)
  try {
    if (activeCategory.value === '造型系列') await setLookFavorite(id, favorite)
    else await setProductFavorite(id, favorite)
    const next = new Set(favoriteIds.value)
    if (favorite) next.add(id)
    else next.delete(id)
    favoriteIds.value = next
  } finally {
    const next = new Set(savingFavorites.value)
    next.delete(id)
    savingFavorites.value = next
  }
}

function openFilter() {
  draftSeries.value = ''
  showFilter.value = true
}

function applyFilter() {
  if (!draftSeries.value) return
  selectedSeries.value = draftSeries.value
  showFilter.value = false
}

function selectNav(key: string, label: string) {
  if (key === 'home') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/home/index`)
    // #endif
    // #ifndef H5
    uni.navigateBack()
    // #endif
    return
  }
  if (key === 'service') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/service/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/service/index' })
    // #endif
    return
  }
  if (key === 'mine') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/profile/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/profile/index' })
    // #endif
  }
}
</script>

<template>
  <view class="works-page">
    <view class="topbar">
      <image class="brand" src="/static/dayplus-logo.png" mode="aspectFit" />
      <text class="topbar-label">作品</text>
      <text class="topbar-index">WORKS / 01</text>
    </view>

    <view class="intro">
      <text class="eyebrow">DAY+ / COLLECTION ARCHIVE</text>
      <text class="title">作品</text>
      <text class="subtitle">以衣物、配件与完整造型，记录每一种自有风格。</text>
    </view>

    <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
      <view class="category-list">
        <text v-for="category in categories" :key="category" :class="['category', { active: activeCategory === category }]" @click="activeCategory = category">{{ category }}</text>
      </view>
    </scroll-view>

    <view class="collection-head">
      <view>
        <text class="collection-kicker">{{ activeCategory === '造型系列' ? 'DAY+ / LOOKS' : 'DAY+ EDITION' }}</text>
        <text class="collection-title">{{ activeCategory === '造型系列' ? selectedSeries : activeCategory }}</text>
      </view>
      <view v-if="activeCategory === '造型系列'" class="filter-trigger" @tap="openFilter">
        <text class="filter-icon">☷</text><text>筛选</text>
      </view>
      <text v-else class="collection-count">{{ activeItems.length.toString().padStart(2, '0') }} ITEMS</text>
    </view>

    <view :class="['works-grid', { looks: activeCategory === '造型系列' }]">
      <view v-for="item in activeItems" :key="item.code + item.name" class="work-card" @click="openWork(item)">
        <view class="image-wrap"><image :src="item.image" mode="aspectFill" /></view>
        <view v-if="activeCategory === '造型系列'" class="work-meta look-meta">
          <text class="work-code">{{ item.code }}</text>
          <button class="favorite look-favorite" :disabled="savingFavorites.has(favoriteId(item))" :aria-label="isFavorite(item) ? '取消收藏造型' : '收藏造型'" @tap.stop="toggleFavorite(item)">
            <image :src="isFavorite(item) ? icons.starFilled : icons.star" />
          </button>
        </view>
        <view v-else class="work-meta product-meta">
          <view class="product-heading">
            <text class="work-code">{{ item.code }}</text>
            <button class="favorite" :disabled="savingFavorites.has(favoriteId(item))" :aria-label="isFavorite(item) ? '取消收藏单品' : '收藏单品'" @tap.stop="toggleFavorite(item)">
              <image :src="isFavorite(item) ? icons.starFilled : icons.star" />
            </button>
          </view>
          <text class="work-name">{{ item.name }}</text>
          <text v-if="productDetails[workProductIds[item.name]]" class="product-price">¥ {{ productDetails[workProductIds[item.name]].price.toLocaleString('en-US') }}</text>
        </view>
      </view>
    </view>

    <view :class="['filter-mask', { 'filter-open': showFilter }]" @tap="showFilter = false" @touchmove.stop.prevent>
      <view class="filter-sheet" @tap.stop>
        <view class="filter-header"><text class="filter-back" @tap="showFilter = false">‹</text><text class="filter-heading">筛选</text><text class="filter-close" @tap="showFilter = false">×</text></view>
        <view class="filter-body">
          <view class="filter-section-title"><text>系列</text><text class="filter-up">⌃</text></view>
          <view v-for="series in seriesOptions" :key="series" class="filter-option" @tap="draftSeries = series">
            <view :class="['checkbox', { checked: draftSeries === series }]">{{ draftSeries === series ? '✓' : '' }}</view>
            <text>{{ series }}</text>
          </view>
        </view>
        <view class="filter-actions">
          <text class="clear-action" @tap="draftSeries = ''">清除</text>
          <text :class="['apply-action', { enabled: !!draftSeries }]" @tap="applyFilter">筛选</text>
        </view>
      </view>
    </view>

    <view class="bottom-nav">
      <view v-for="item in navItems" :key="item.key" :class="['nav-item', { active: item.key === 'works' }]" @tap="selectNav(item.key, item.label)">
        <image class="nav-icon" :src="item.icon" />
        <text>{{ item.label }}</text>
      </view>
    </view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.works-page { min-height: 100vh; padding-bottom: calc(128rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { height: 112rpx; padding: 42rpx 42rpx 0; display: flex; align-items: flex-start; border-bottom: 1px solid #dedcd7; }
.brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }.topbar-label { margin-left: 30rpx; color: #8b8883; font-size: 21rpx; letter-spacing: 2rpx; }.topbar-index { margin-left: auto; color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }
.intro { padding: 76rpx 42rpx 52rpx; }.eyebrow, .collection-kicker { color: #8b8883; font-size: 18rpx; letter-spacing: 3rpx; }.title { display: block; margin-top: 25rpx; font-size: 64rpx; font-weight: 300; letter-spacing: 8rpx; }.subtitle { display: block; max-width: 520rpx; margin-top: 22rpx; color: #8b8883; font-size: 21rpx; line-height: 1.8; letter-spacing: 1rpx; }
.category-scroll { width: 100%; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.category-list { display: inline-flex; padding: 27rpx 42rpx 24rpx; gap: 45rpx; white-space: nowrap; }.category { position: relative; color: #9b968e; font-size: 22rpx; letter-spacing: 2rpx; }.category.active { color: #171716; }.category.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -25rpx; height: 3rpx; background: #171716; }
.collection-head { padding: 62rpx 42rpx 30rpx; display: flex; align-items: flex-end; justify-content: space-between; }.collection-title { display: block; margin-top: 15rpx; font-size: 34rpx; letter-spacing: 4rpx; }.collection-count { color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }
.filter-trigger { display: flex; align-items: center; gap: 12rpx; color: #171716; font-size: 24rpx; }.filter-icon { font-size: 34rpx; line-height: 1; }
.works-grid { padding: 0 42rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 48rpx 20rpx; }.work-card { min-width: 0; }.image-wrap { height: 410rpx; background: #ebe8e2; overflow: hidden; }.image-wrap image { width: 100%; height: 100%; }.work-meta { padding-top: 18rpx; }.work-code { color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }.work-name { display: block; margin-top: 9rpx; font-size: 22rpx; letter-spacing: 1rpx; }.works-grid.looks .image-wrap { height: 500rpx; }.look-meta, .product-heading { display: flex; align-items: center; justify-content: space-between; }.favorite { width: 52rpx; height: 52rpx; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: transparent; line-height: 1; }.favorite::after { border: 0; }.favorite image { width: 30rpx; height: 30rpx; }.product-price { display: block; margin-top: 12rpx; font-size: 20rpx; letter-spacing: 1rpx; }.works-grid.looks .work-name { font-size: 23rpx; }
.filter-mask { position: fixed; z-index: 30; inset: 0; display: flex; align-items: flex-end; overflow: hidden; background: rgba(0,0,0,0); visibility: hidden; pointer-events: none; transition: background-color .3s ease, visibility 0s linear .3s; }.filter-mask.filter-open { background: rgba(0,0,0,.38); visibility: visible; pointer-events: auto; transition-delay: 0s; }.filter-sheet { width: 100%; height: 82vh; display: flex; flex-direction: column; background: #fff; color: #171716; transform: translateY(100%); transition: transform .3s cubic-bezier(.22,.61,.36,1); }.filter-open .filter-sheet { transform: translateY(0); }.filter-header { height: 112rpx; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 42rpx; border-bottom: 1px solid #e8e8e8; }.filter-back, .filter-close { width: 52rpx; font-size: 54rpx; line-height: 1; font-weight: 200; }.filter-heading { font-size: 30rpx; font-weight: 600; }.filter-close { text-align: right; }.filter-body { flex: 1; padding: 52rpx 50rpx; }.filter-section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 42rpx; font-size: 27rpx; font-weight: 600; }
.filter-up { font-size: 36rpx; font-weight: 300; display:none;}.filter-option { min-height: 66rpx; display: flex; align-items: center; gap: 20rpx; color: #262522; font-size: 25rpx; }.checkbox { width: 24rpx; height: 24rpx; flex: none; display: flex; align-items: center; justify-content: center; border: 2rpx solid #777; font-size: 21rpx; }.checkbox.checked { border-color: #171716; background: #171716; color: #fff; }.filter-actions { height: calc(108rpx + env(safe-area-inset-bottom)); flex: none; display: flex; border-top: 1px solid #e8e8e8; padding-bottom: env(safe-area-inset-bottom); }.clear-action, .apply-action { width: 50%; display: flex; align-items: center; justify-content: center; font-size: 27rpx; font-weight: 600; }.clear-action { color: #b5b5b5; }.apply-action { background: #a7a7a7; color: #fff; }.apply-action.enabled { background: #050505; }
.bottom-nav { position: fixed; z-index: 10; left: 0; right: 0; bottom: 0; padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); display: flex; justify-content: space-around; background: rgba(248,247,244,.97); border-top: 1px solid rgba(222,220,215,.6); }.nav-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; color: #9b968e; font-size: 19rpx; letter-spacing: 2rpx; }.nav-item.active { color: #171716; }.nav-icon { width: 40rpx; height: 40rpx; opacity: .55; }.nav-item.active .nav-icon { opacity: 1; }
@media (min-width: 700px) { .works-page { max-width: 540px; margin: 0 auto; box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
