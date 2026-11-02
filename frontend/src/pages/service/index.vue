<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
const icons = {
  home: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z"/><path d="M9.5 21.5v-7h5v7"/></svg>'),
  works: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4.5a2 2 0 1 1 2 2V8"/><path d="M12 8l9.2 6.4a1.4 1.4 0 0 1-.8 2.6H3.6a1.4 1.4 0 0 1-.8-2.6L12 8z"/></svg>'),
  service: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'),
  mine: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/></svg>')
}

const navItems = [
  { key: 'home', label: '首页', icon: icons.home },
  { key: 'works', label: '作品', icon: icons.works },
  { key: 'service', label: '服务', icon: icons.service },
  { key: 'mine', label: '我的', icon: icons.mine }
]

const entries = ['服务预约', '活动日历', '在线服务']

function openEntry(entry: string) {
  const path = entry === '活动日历' ? '/pages/activity/index' : '/pages/appointment/index'
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

function openCustomerService() {
  uni.showToast({
    title: '请在微信小程序中打开在线客服',
    icon: 'none'
  })
}

function selectNav(key: string, label: string) {
  if (key === 'home' || key === 'works') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/${key}/index`)
    // #endif
    // #ifndef H5
    if (key === 'home') uni.navigateBack()
    else uni.navigateTo({ url: '/pages/works/index' })
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
  <view class="service-page">
    <view class="topbar"><text>服务</text></view>

    <view class="hero">
      <image class="hero-image" src="../../static/appointment.jpg" mode="aspectFill" />
      <view class="hero-shade" />
      <view class="hero-copy">
        <text class="eyebrow">DAY+ / CLIENT SERVICES</text>
        <text class="hero-title">专属服务，
随时为你开启</text>
        <text class="hero-link" @tap="uni.showToast({ title: '服务详情正在准备中', icon: 'none' })">了解更多 <text class="arrow">↗</text></text>
      </view>
    </view>

    <view class="entry-list">
      <template v-for="(entry, index) in entries" :key="entry">
        <!-- #ifdef MP-WEIXIN -->
        <button
          v-if="entry === '在线服务'"
          class="entry customer-service"
          open-type="contact"
          session-from="DAY+ 在线服务"
        >
          <text class="entry-index">0{{ index + 1 }}</text>
          <text class="entry-title">{{ entry }}</text>
          <text class="entry-arrow">↗</text>
        </button>
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <view v-if="entry === '在线服务'" class="entry" @tap="openCustomerService">
          <text class="entry-index">0{{ index + 1 }}</text>
          <text class="entry-title">{{ entry }}</text>
          <text class="entry-arrow">↗</text>
        </view>
        <!-- #endif -->

        <view v-if="entry !== '在线服务'" class="entry" @tap="openEntry(entry)">
          <text class="entry-index">0{{ index + 1 }}</text>
          <text class="entry-title">{{ entry }}</text>
          <text class="entry-arrow">↗</text>
        </view>
      </template>
    </view>

    <view class="bottom-nav">
      <view v-for="item in navItems" :key="item.key" :class="['nav-item', { active: item.key === 'service' }]" @tap="selectNav(item.key, item.label)">
        <image class="nav-icon" :src="item.icon" />
        <text>{{ item.label }}</text>
      </view>
    </view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.service-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: calc(128rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { height: 100rpx; display: flex; align-items: center; justify-content: center; font-size: 27rpx; letter-spacing: 5rpx; }
.hero { height: 760rpx; position: relative; overflow: hidden; background: #ebe8e2; }
.hero-image { width: 100%; height: 100%; }
.hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.06) 35%, rgba(0,0,0,.72)); }
.hero-copy { position: absolute; left: 44rpx; right: 44rpx; bottom: 70rpx; display: flex; flex-direction: column; color: #fff; }
.eyebrow { color: rgba(255,255,255,.72); font-size: 18rpx; letter-spacing: 3rpx; }
.hero-title { margin-top: 25rpx; white-space: pre-line; font-size: 48rpx; line-height: 1.45; font-weight: 300; letter-spacing: 4rpx; }
.hero-link { width: fit-content; margin-top: 30rpx; padding-bottom: 10rpx; border-bottom: 1px solid rgba(255,255,255,.65); font-size: 22rpx; letter-spacing: 2rpx; }
.arrow { margin-left: 18rpx; }
.entry-list { padding: 0 42rpx; }
.entry { min-height: 126rpx; display: flex; align-items: center; border-bottom: 1px solid #dedcd7; }
.entry:first-child { border-top: 1px solid #dedcd7; }
.customer-service { width: 100%; margin: 0; padding: 0; border-radius: 0; background: transparent; color: #171716; text-align: left; line-height: normal; }
.customer-service::after { border: 0; }
.entry-index { width: 76rpx; color: #a09b93; font-size: 17rpx; letter-spacing: 2rpx; }
.entry-title { flex: 1; font-size: 25rpx; font-weight: 300; letter-spacing: 3rpx; }
.entry-arrow { color: #8b8883; font-size: 25rpx; }
.bottom-nav { position: fixed; z-index: 10; left: 50%; bottom: 0; width: 100%; max-width: 540px; box-sizing: border-box; transform: translateX(-50%); padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); display: flex; justify-content: space-around; background: rgba(248,247,244,.97); border-top: 1px solid rgba(222,220,215,.6); }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; color: #9b968e; font-size: 19rpx; letter-spacing: 2rpx; }
.nav-item.active { color: #171716; }
.nav-icon { width: 40rpx; height: 40rpx; opacity: .55; }
.nav-item.active .nav-icon { opacity: 1; }
</style>
