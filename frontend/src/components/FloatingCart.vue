<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cartCount, fetchCartItems, getCartCount } from '../api/cart'
let requestId = 0

async function refreshCart() {
  const currentRequest = ++requestId
  cartCount.value = getCartCount()
  try {
    const items = await fetchCartItems()
    if (currentRequest === requestId) {
      cartCount.value = items.reduce((sum, item) => sum + item.quantity, 0)
    }
  } catch {
    // 保留本地存储中的数量。
  }
}

function openCart() {
  uni.navigateTo({ url: '/pages/cart/index' })
}

uni.$on('cart-updated', refreshCart)
onMounted(refreshCart)
onShow(refreshCart)
onBeforeUnmount(() => {
  ++requestId
  uni.$off('cart-updated', refreshCart)
})
</script>

<template>
  <view class="floating-cart" role="button" :aria-label="`购物车，${cartCount}件商品`" @tap.stop="openCart">
    <view class="cart-icon"><view class="cart-handle" /></view>
    <text v-if="cartCount > 0" class="cart-count">{{ cartCount }}</text>
  </view>
</template>

<style scoped>
.floating-cart { position: fixed; z-index: 100; right: 28rpx; bottom: 150rpx; bottom: calc(150rpx + env(safe-area-inset-bottom)); width: 96rpx; height: 96rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #171716; color: #f8f7f4; box-shadow: 0 8rpx 24rpx rgba(23,23,22,.22); }
.cart-icon { position: relative; box-sizing: border-box; width: 34rpx; height: 32rpx; margin-top: 8rpx; border: 2rpx solid #f8f7f4; border-radius: 3rpx; }
.cart-handle { position: absolute; left: 8rpx; top: -13rpx; width: 14rpx; height: 15rpx; box-sizing: border-box; border: 2rpx solid #f8f7f4; border-bottom: 0; border-radius: 10rpx 10rpx 0 0; }
.cart-count { position: absolute; right: -5rpx; top: -8rpx; min-width: 32rpx; height: 32rpx; padding: 0 7rpx; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border-radius: 18rpx; background: #8d6255; color: #fff; font-size: 17rpx; }
@media (min-width: 700px) { .floating-cart { right: calc(50% - 250px); } }
</style>
