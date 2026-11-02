<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchLookDetail, setProductFavorite } from '../../api/works'
import { productDetails } from '../../data/works'
import type { LookCategory, LookDetail, LookProduct } from '../../data/works'

const detail = ref<LookDetail | null>(null)
const loading = ref(true)
const failed = ref(false)
const lookId = ref('')
const activeSlide = ref(0)
const saving = ref<string[]>([])
const returnPath = ref('/pages/works/index')
const categoryOrder: LookCategory[] = ['帽子', '眼镜', '成衣', '手袋', '鞋子', '配饰']
const groups = computed(() => categoryOrder.map((category) => ({
  category,
  products: detail.value?.products.filter((product) => product.category === category) ?? []
})).filter((group) => group.products.length > 0))

const icon = (filled: boolean) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? '#171716' : 'none'}" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
)
const star = icon(false)
const starFilled = icon(true)

onLoad((query) => {
  const series = String(query?.series ?? '')
  const code = String(query?.code ?? '')
  lookId.value = String(query?.id ?? '') || (series && code ? `${decodeURIComponent(series)}:${decodeURIComponent(code)}` : '')
  returnPath.value = query?.from === 'home' ? '/pages/home/index' : '/pages/works/index'
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  failed.value = false
  try {
    detail.value = await fetchLookDetail(lookId.value)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function openProduct(product: LookProduct) {
  const path = `/pages/works/product?id=${encodeURIComponent(product.id)}&from=look&returnTo=${encodeURIComponent(`/pages/works/detail?id=${encodeURIComponent(lookId.value)}`)}`
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

async function toggleFavorite(product: LookProduct) {
  if (saving.value.includes(product.id)) return
  saving.value.push(product.id)
  try {
    const result = await setProductFavorite(product.id, !product.favorite)
    product.favorite = result.favorite
    uni.showToast({ title: result.favorite ? '已加入收藏' : '已取消收藏', icon: 'none' })
  } catch {
    uni.showToast({ title: '收藏失败，请稍后重试', icon: 'none' })
  } finally {
    saving.value = saving.value.filter((id) => id !== product.id)
  }
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#${returnPath.value}`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: returnPath.value })
  // #endif
}
</script>

<template>
  <view class="look-page">
    <view class="topbar">
      <view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view>
      <image class="brand" src="/static/dayplus-logo.png" mode="aspectFit" />
      <text class="topbar-label">造型详情</text>
    </view>

    <view v-if="loading" class="status">正在加载造型…</view>
    <view v-else-if="failed" class="status"><text>加载失败，请稍后重试</text><button class="retry" @tap="loadDetail">重新加载</button></view>
    <template v-else-if="detail">
      <view class="gallery">
        <swiper class="look-swiper" :current="activeSlide" :circular="detail.images.length > 1" :duration="400" @change="activeSlide = $event.detail.current">
          <swiper-item v-for="(image, index) in detail.images" :key="index">
            <image class="look-image" :src="image.src" :style="image.imageStyle" :alt="`${detail.name} · ${image.label}`" mode="aspectFill" />
          </swiper-item>
        </swiper>
        <view class="gallery-bottom">
          <text class="look-code">{{ detail.code }}</text>
          <view class="dots"><view v-for="(_, index) in detail.images" :key="index" :class="['dot', { active: activeSlide === index }]" /></view>
          <text class="image-count">{{ String(activeSlide + 1).padStart(2, '0') }} / {{ String(detail.images.length).padStart(2, '0') }}</text>
        </view>
      </view>

      <view class="look-intro">
        <text class="eyebrow">DAY+ / {{ detail.code }}</text>
        <text class="series">{{ detail.series }}</text>
        <text class="description">{{ detail.description }}</text>
      </view>

      <view class="pieces">
        <view class="section-heading"><text class="section-title">造型单品</text><text class="eyebrow">SHOP THE LOOK</text></view>
        <view v-for="group in groups" :key="group.category" class="category-section">
          <view class="category-heading"><text>{{ group.category }}</text><text class="category-count">{{ String(group.products.length).padStart(2, '0') }}</text></view>
          <view class="product-grid">
            <view v-for="product in group.products" :key="product.id" class="product-card">
              <view class="product-image-wrap" @tap="openProduct(product)">
                <image class="product-image" :src="product.image" :style="product.imageStyle" :alt="group.category" mode="aspectFill" />
              </view>
              <view class="product-meta">
                <view class="product-name-row">
                  <text class="product-name" @tap="openProduct(product)">{{ productDetails[product.id]?.name ?? product.id }}</text>
                  <button class="favorite" :disabled="saving.includes(product.id)" :aria-label="product.favorite ? '取消收藏' : '收藏单品'" @tap.stop="toggleFavorite(product)">
                    <image :src="product.favorite ? starFilled : star" />
                  </button>
                </view>
                <text class="price" @tap="openProduct(product)">¥ {{ product.price.toLocaleString('en-US') }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="footer"><image class="footer-brand" src="/static/dayplus-logo.png" mode="aspectFit" /><text>日常之中，自有风格。</text></view>
    </template>
    <view v-else class="status">该造型暂不存在，请返回选择其他造型。</view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.look-page { min-height: 100vh; padding-bottom: env(safe-area-inset-bottom); background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding: var(--status-bar-height, 0px) 36rpx 0; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }
.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }
.brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }
.topbar-label { position: absolute; right: 36rpx; bottom: 40rpx; font-size: 19rpx; color: #8b8883; letter-spacing: 2rpx; }
.gallery { position: relative; background: #ebe8e2; }
.look-swiper { width: 100%; height: 960rpx; }
.look-image { width: 100%; height: 100%; }
.gallery-bottom { position: absolute; left: 30rpx; right: 30rpx; bottom: 28rpx; padding: 16rpx 20rpx; display: flex; align-items: center; justify-content: space-between; background: rgba(248,247,244,.85); }
.look-code, .image-count { font-size: 17rpx; letter-spacing: 2rpx; min-width: 100rpx; }
.image-count { text-align: right; }
.dots { display: flex; gap: 10rpx; }
.dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #beb9b0; }
.dot.active { background: #171716; }
.look-intro { padding: 50rpx 42rpx 56rpx; border-bottom: 1px solid #dedcd7; }
.eyebrow { font-size: 17rpx; letter-spacing: 3rpx; color: #8b8883; }
.series { display: block; margin-top: 20rpx; font-size: 36rpx; letter-spacing: 4rpx; font-weight: 400; }
.description { display: block; margin-top: 24rpx; font-size: 24rpx; line-height: 1.95; color: #77736c; letter-spacing: 1rpx; }
.pieces { padding: 50rpx 42rpx 0; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.section-title { font-size: 32rpx; letter-spacing: 4rpx; }
.category-section { margin-top: 40rpx; }
.category-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20rpx; margin-bottom: 22rpx; border-bottom: 1px solid #dedcd7; font-size: 23rpx; letter-spacing: 2rpx; }
.category-count { color: #a09b93; font-size: 17rpx; }
.product-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30rpx 20rpx; }
.product-card { min-width: 0; }
.product-image-wrap { height: 380rpx; overflow: hidden; background: #ebe8e2; }
.product-image { width: 100%; height: 100%; }
.product-meta { padding-top: 18rpx; }
.product-name-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; min-height: 52rpx; }
.product-name { min-width: 0; flex: 1; font-size: 23rpx; line-height: 1.4; letter-spacing: 1rpx; }
.favorite { flex: none; width: 52rpx; height: 52rpx; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: transparent; line-height: 1; }
.favorite::after { border: none; }
.favorite image { width: 30rpx; height: 30rpx; }
.price { display: block; padding-top: 10rpx; font-size: 24rpx; letter-spacing: 1rpx; text-align: left; }
.footer { padding: 76rpx 42rpx 50rpx; display: flex; flex-direction: column; align-items: center; gap: 18rpx; font-size: 19rpx; color: #9b968e; letter-spacing: 3rpx; }
.footer-brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }
.status { min-height: 60vh; padding: 80rpx 42rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30rpx; color: #8b8883; font-size: 24rpx; text-align: center; }
.retry { padding: 0 36rpx; border-radius: 0; background: #171716; color: #fff; font-size: 24rpx; }
@media (min-width: 700px) { .look-page { max-width: 540px; margin: 0 auto; box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
