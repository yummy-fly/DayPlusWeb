<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addProductToCart, fetchProductDetail, setProductFavorite } from '../../api/works'
import type { ProductDetail } from '../../data/works'

const product = ref<ProductDetail | null>(null)
const loading = ref(true)
const failed = ref(false)
const productId = ref('')
const activeSlide = ref(0)
const selectedColor = ref('')
const selectedSize = ref('')
const quantity = ref(1)
const adding = ref(false)
const returnPath = ref('/pages/works/index')

function decodeRoute(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !value) return fallback
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const star = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>')
const starFilled = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#171716" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>')

onLoad((query) => {
  productId.value = String(query?.id ?? '')
  returnPath.value = decodeRoute(query?.returnTo, query?.from === 'home' ? '/pages/home/index' : '/pages/works/index')
  loadProduct()
})

const currentImages = computed(() => {
  if (!product.value) return []
  return product.value.colorImages[selectedColor.value] ?? product.value.images
})
const canAdd = computed(() => !!product.value && !!selectedColor.value && !!selectedSize.value && !adding.value)

function selectColor(color: string) {
  selectedColor.value = color
  activeSlide.value = 0
}

function changeQuantity(delta: number) {
  quantity.value = Math.max(1, quantity.value + delta)
}

async function loadProduct() {
  loading.value = true
  failed.value = false
  try {
    product.value = await fetchProductDetail(productId.value)
    if (product.value) {
      selectedColor.value = product.value.colors[0] ?? ''
      selectedSize.value = product.value.sizes[0] ?? ''
    }
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function toggleFavorite() {
  if (!product.value) return
  const result = await setProductFavorite(product.value.id, !product.value.favorite)
  product.value.favorite = result.favorite
  uni.showToast({ title: result.favorite ? '已加入收藏' : '已取消收藏', icon: 'none' })
}

async function addToCart() {
  if (!product.value || !canAdd.value) return
  adding.value = true
  try {
    await addProductToCart({ id: product.value.id, color: selectedColor.value, size: selectedSize.value, quantity: quantity.value })
    uni.$emit('cart-updated')
    uni.showToast({ title: '已加入购物车', icon: 'none' })
  } finally {
    adding.value = false
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
  <view class="product-page">
    <view class="topbar"><view class="back" @tap="goBack"><view class="back-arrow" /></view><text class="brand">DAY+</text><text class="topbar-label">单品详情</text></view>
    <view v-if="loading" class="status">正在加载单品…</view>
    <view v-else-if="failed" class="status"><text>加载失败，请稍后重试</text><button class="retry" @tap="loadProduct">重新加载</button></view>
    <view v-else-if="product" class="content">
      <view class="gallery">
        <swiper class="product-swiper" :current="activeSlide" :circular="currentImages.length > 1" @change="activeSlide = $event.detail.current">
          <swiper-item v-for="(image, index) in currentImages" :key="`${selectedColor}-${index}`"><image class="product-image" :src="image.src" :style="image.imageStyle" :alt="`${product.name} · ${selectedColor} · ${image.label}`" mode="aspectFill" /></swiper-item>
        </swiper>
        <view class="gallery-bottom"><text>{{ product.code }} / {{ selectedColor }}</text><view class="dots"><view v-for="(_, index) in currentImages" :key="index" :class="['dot', { active: activeSlide === index }]" /></view><text>{{ String(activeSlide + 1).padStart(2, '0') }} / {{ String(currentImages.length).padStart(2, '0') }}</text></view>
      </view>
      <view class="intro"><text class="eyebrow">{{ product.category }} / DAY+ EDITION</text><text class="name">{{ product.name }}</text><text class="price">¥ {{ product.price.toLocaleString('en-US') }}</text><text class="description">{{ product.description }}</text></view>
      <view class="options">
        <view class="option-section"><view class="option-title"><text>颜色</text></view><view class="option-list"><text v-for="color in product.colors" :key="color" :class="['option', { selected: selectedColor === color }]" @tap="selectColor(color)">{{ color }}</text></view></view>
        <view class="option-section"><view class="option-title"><text>尺码</text></view><view class="option-list"><text v-for="size in product.sizes" :key="size" :class="['option', { selected: selectedSize === size }]" @tap="selectedSize = size">{{ size }}</text></view></view>
        <view class="option-section quantity-section"><view class="option-title"><text>数量</text></view><view class="quantity-control"><button class="quantity-button" :disabled="quantity <= 1" @tap="changeQuantity(-1)">−</button><text class="quantity-value">{{ quantity }}</text><button class="quantity-button" @tap="changeQuantity(1)">+</button></view></view>
      </view>
      <view class="actions"><button class="favorite" @tap="toggleFavorite"><image :src="product.favorite ? starFilled : star" /><text>{{ product.favorite ? '已收藏' : '收藏' }}</text></button><button class="cart" :disabled="!canAdd" @tap="addToCart">{{ adding ? '加入中…' : '加入购物车' }}</button></view>
      <view class="footer"><text class="footer-brand">DAY+</text><text>日常之中，自有风格。</text></view>
    </view>
    <view v-else class="status">该单品暂不存在，请返回选择其他单品。</view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.product-page { min-height: 100vh; padding-bottom: env(safe-area-inset-bottom); background: #f8f7f4; color: #171716; }.topbar { position: relative; height: 108rpx; padding: 0 36rpx; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; }.back { position: absolute; left: 24rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }.brand { font-size: 27rpx; font-weight: 600; letter-spacing: 6rpx; }.topbar-label { position: absolute; right: 36rpx; color: #8b8883; font-size: 19rpx; letter-spacing: 2rpx; }.gallery { position: relative; background: #ebe8e2; }.product-swiper { height: 850rpx; }.product-image { width: 100%; height: 100%; }.gallery-bottom { position: absolute; left: 30rpx; right: 30rpx; bottom: 28rpx; padding: 16rpx 20rpx; display: flex; align-items: center; justify-content: space-between; background: rgba(248,247,244,.85); font-size: 17rpx; letter-spacing: 2rpx; }.dots { display: flex; gap: 10rpx; }.dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #beb9b0; }.dot.active { background: #171716; }.intro { padding: 48rpx 42rpx 46rpx; border-bottom: 1px solid #dedcd7; }.eyebrow { display: block; color: #8b8883; font-size: 17rpx; letter-spacing: 3rpx; }.name { display: block; margin-top: 19rpx; font-size: 38rpx; letter-spacing: 4rpx; }.price { display: block; margin-top: 20rpx; font-size: 28rpx; }.description { display: block; margin-top: 28rpx; color: #77736c; font-size: 23rpx; line-height: 1.9; letter-spacing: 1rpx; }.options { padding: 44rpx 42rpx 20rpx; }.option-section { margin-bottom: 34rpx; }.option-title { display: flex; justify-content: space-between; margin-bottom: 20rpx; font-size: 23rpx; letter-spacing: 2rpx; }.option-title text:last-child { color: #8b8883; }.option-list { display: flex; flex-wrap: wrap; gap: 16rpx; }.option { min-width: 106rpx; padding: 17rpx 24rpx; box-sizing: border-box; border: 1px solid #d5d2cc; text-align: center; font-size: 22rpx; }.option.selected { border-color: #171716; background: #171716; color: #fff; }.quantity-section { display: block; }.quantity-section .option-title { margin-bottom: 20rpx; }.quantity-control { display: flex; align-items: center; width: fit-content; height: 64rpx; border: 1px solid #d5d2cc; }
.quantity-button { width: 64rpx; height: 62rpx; padding: 0; margin: 0; border: 0; border-radius: 0; background: transparent; color: #171716; font-size: 30rpx; line-height: 62rpx; }
.quantity-button::after { border: 0; }.quantity-button[disabled] { background-color: transparent !important; color: #aaa69f; }
.quantity-value { min-width: 58rpx; text-align: center; font-size: 23rpx; }.actions { display: flex; gap: 16rpx; padding: 14rpx 42rpx 46rpx; }.actions button { height: 88rpx; margin: 0; border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 24rpx; letter-spacing: 2rpx; }.actions button::after { border: 0; }.favorite { width: 32%; background: transparent; border: 1px solid #171716; }.favorite image { width: 30rpx; height: 30rpx; margin-right: 12rpx; }.cart { flex: 1; background: #171716; color: #fff; }.cart[disabled] { background: #b8b5af; }.footer { padding: 40rpx 42rpx 70rpx; display: flex; flex-direction: column; align-items: center; gap: 18rpx; color: #9b968e; font-size: 19rpx; letter-spacing: 3rpx; }.footer-brand { color: #171716; font-size: 26rpx; letter-spacing: 5rpx; }.status { min-height: 60vh; padding: 80rpx 42rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30rpx; color: #8b8883; font-size: 24rpx; text-align: center; }.retry { padding: 0 36rpx; border-radius: 0; background: #171716; color: #fff; font-size: 24rpx; }@media (min-width: 700px) { .product-page { max-width: 540px; margin: 0 auto; box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
