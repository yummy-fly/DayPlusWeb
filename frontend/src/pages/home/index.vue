<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { ref, onMounted } from 'vue'
import { fetchHeroSlides, fetchLooks, fetchProducts, fetchPoints, isLoggedIn, login as apiLogin } from '../../api/home'
import { onShow } from '@dcloudio/uni-app'
import type { HeroSlide, Look, Product } from '../../data/home'
import { workProductIds } from '../../data/works'

/* ---------- 细线图标（SVG data-uri，无边框，贴合黑白极简风格） ---------- */
const svgIcon = (paths: string, filled = false) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? '#171716' : 'none'}" stroke="#171716" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  )

const icons = {
  home: svgIcon('<path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z"/><path d="M9.5 21.5v-7h5v7"/>'),
  works: svgIcon('<path d="M10 4.5a2 2 0 1 1 2 2V8"/><path d="M12 8l9.2 6.4a1.4 1.4 0 0 1-.8 2.6H3.6a1.4 1.4 0 0 1-.8-2.6L12 8z"/>'),
  service: svgIcon('<path d="M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  mine: svgIcon('<path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/>'),
  shop: svgIcon('<path d="M6.5 2.5 3.5 6.5V20a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 20V6.5l-3-4z"/><path d="M3.5 6.5h17"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
  cart: svgIcon('<circle cx="9" cy="20.5" r="1.4"/><circle cx="18.5" cy="20.5" r="1.4"/><path d="M2 2.5h3l2.6 12.7a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21.5 7H6"/>'),
  calendar: svgIcon('<rect x="3" y="4.5" width="18" height="17" rx="1.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>'),
  gift: svgIcon('<path d="M20 12v9.5H4V12"/><rect x="2" y="7" width="20" height="5" rx="0.5"/><path d="M12 21.5V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>'),
  star: svgIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  starFilled: svgIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', true),
  arrow: svgIcon('<path d="M7 17 17 7"/><path d="M9 7h8v8"/>')
}

/* ---------- 页面数据（通过 API 层加载，本地/远程模式见 src/config） ---------- */
const heroSlides = ref<HeroSlide[]>([])
const looks = ref<Look[]>([])
const products = ref<Product[]>([])

onMounted(async () => {
  const [slides, lookList, productList] = await Promise.all([
    fetchHeroSlides(),
    fetchLooks(),
    fetchProducts()
  ])
  heroSlides.value = slides
  looks.value = lookList
  products.value = productList
})

const featureEntries = [
  { icon: icons.shop, title: '全部商品' },
  { icon: icons.works, title: '作品' },
  { icon: icons.service, title: '预约到店' },
  { icon: icons.calendar, title: '活动日历' },
  { icon: icons.gift, title: '积分商城' },
  { icon: icons.cart, title: '购物车' }
]

const navItems = [
  { key: 'home', icon: icons.home, label: '首页' },
  { key: 'works', icon: icons.works, label: '作品' },
  { key: 'service', icon: icons.service, label: '服务' },
  { key: 'mine', icon: icons.mine, label: '我的' }
]

/* ---------- 状态 ---------- */
const activeSlide = ref(0)
const activeNav = ref('home')
const showNotice = ref(false)
const noticeText = ref('')
const loggedIn = ref(false)
const points = ref(0)
const favorites = ref<Set<string>>(new Set())

onShow(async () => {
  loggedIn.value = isLoggedIn()
  if (!loggedIn.value) return
  try {
    points.value = (await fetchPoints()).points
  } catch {
    notify('积分加载失败，请稍后重试')
  }
})

function notify(text: string) {
  noticeText.value = text
  showNotice.value = true
  setTimeout(() => { showNotice.value = false }, 1800)
}

function openProduct(product: Product) {
  const id = workProductIds[product.name] ?? product.id
  const path = `/pages/works/product?id=${encodeURIComponent(id)}&from=home`
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

function openLook(look: Look) {
  if (!look.id) {
    selectNav('works', '作品')
    return
  }
  const path = `/pages/works/detail?id=${encodeURIComponent(look.id)}`
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#${path}`)
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: path })
  // #endif
}

function goTo(label: string) {
  if (label === '积分商城') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/points/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/points/index' })
    // #endif
    return
  }
  if (label === '购物车') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/cart/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/cart/index' })
    // #endif
    return
  }
  if (label === '全部商品' || label === '作品') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/works/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/works/index' })
    // #endif
    return
  }
  if (label === '活动日历') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/activity/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/activity/index' })
    // #endif
    return
  }
  if (label === '预约到店') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/service/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: '/pages/service/index' })
    // #endif
    return
  }
  notify(`${label}页面正在准备中`)
}

async function login() {
  try {
    const res = await apiLogin()
    loggedIn.value = true
    points.value = res.points
    notify('登录成功')
  } catch (e) {
    notify('登录失败，请稍后重试')
  }
}

function toggleFavorite(name: string) {
  if (favorites.value.has(name)) {
    favorites.value.delete(name)
    notify('已取消收藏')
  } else {
    favorites.value.add(name)
    notify(`${name}已加入收藏`)
  }
  favorites.value = new Set(favorites.value)
}

function selectNav(key: string, label: string) {
  if (key === 'works' || key === 'service' || key === 'mine') {
    // #ifdef H5
    window.location.assign(`${window.location.pathname}#/pages/${key === 'mine' ? 'profile' : key}/index`)
    // #endif
    // #ifndef H5
    uni.navigateTo({ url: `/pages/${key === 'mine' ? 'profile' : key}/index` })
    // #endif
    return
  }
  activeNav.value = key
  if (key !== 'home') goTo(label)
}
</script>

<template>
  <view class="home-page">
    <view class="hero-section">
      <swiper class="hero-swiper" :current="activeSlide" circular :autoplay="true" :interval="5000" :duration="500" @change="activeSlide = $event.detail.current">
        <swiper-item v-for="slide in heroSlides" :key="slide.code">
          <view class="hero-slide" @click="goTo(slide.action)">
            <image class="hero-image" :src="slide.image" mode="aspectFill" />
            <view class="hero-shade" />
            <view class="hero-copy"><text class="eyebrow">{{ slide.eyebrow }}</text><text class="hero-title">{{ slide.title }}</text><view class="hero-link"><text>{{ slide.action }}</text><image class="hero-arrow" :src="icons.arrow" /></view></view>
            <view class="hero-index">{{ slide.code }}</view>
          </view>
        </swiper-item>
      </swiper>
      <view class="hero-dots"><text v-for="(_, index) in heroSlides" :key="index" :class="{ active: activeSlide === index }" /></view>
    </view>

    <view class="section collection-section">
      <view class="section-heading"><view><text class="eyebrow dark">FEATURED LOOKS</text><text class="section-title">成品搭配</text></view><text class="section-count">0{{ looks.length - 1 }} LOOKS</text></view>
      <scroll-view scroll-x class="look-scroll" :show-scrollbar="false">
        <view v-for="look in looks" :key="look.label || look.title" :class="['look-card', { more: !look.image }]" @tap="openLook(look)">
          <image v-if="look.image" :src="look.image" mode="aspectFill" />
          <view v-else class="more-look"><text class="more-icon">↗</text><text>更多搭配</text></view>
          <view v-if="look.image" class="look-label"><text>{{ look.label }}</text></view>
        </view>
      </scroll-view>
    </view>

    <view class="section products-section">
      <view class="section-heading"><view><text class="eyebrow dark">BEST SELLERS</text><text class="section-title">商品推荐</text></view><text class="more-link" @click="goTo('全部商品')">查看全部 <text class="more-arrow">↗</text></text></view>
      <view class="product-grid">
        <view v-for="product in products" :key="product.name" class="product-card">
          <view class="product-image-wrap" @click="openProduct(product)">
            <image :src="product.image" mode="aspectFill" />
          </view>
          <view class="product-name-row">
            <text class="product-name">{{ product.name }}</text>
            <view class="fav-button" role="button" :aria-label="favorites.has(product.name) ? '取消收藏' : '收藏'" @click.stop="toggleFavorite(product.name)">
              <image :src="favorites.has(product.name) ? icons.starFilled : icons.star" />
            </view>
          </view><text class="product-detail">{{ product.detail }}</text><text class="product-price">{{ product.price }}</text>
        </view>
      </view>
    </view>

    <view class="section features-section">
      <view class="section-heading"><view><text class="eyebrow dark">DISCOVER DAY+</text><text class="section-title">探索更多</text></view></view>
      <view class="feature-card">
        <view v-for="entry in featureEntries" :key="entry.title" class="feature-item" @click="goTo(entry.title)">
          <image class="feature-icon" :src="entry.icon" />
          <text class="feature-title">{{ entry.title }}</text>
        </view>
      </view>

      <view class="points-card">
        <view class="points-info">
          <text class="points-label">DAY+ 积分</text>
          <text class="points-tip">{{ loggedIn ? '消费可累积积分，用于兑换好礼' : '登录后可查看积分余额' }}</text>
        </view>
        <view v-if="loggedIn" class="points-balance"><text class="points-value">{{ points.toLocaleString() }}</text><text class="points-unit">积分</text></view>
        <view v-else class="points-login" @click="login"><text>登录查看</text><text class="points-login-arrow">›</text></view>
      </view>
    </view>

    <view class="footer-mark">DAY<span>+</span><text>WEAR YOUR OWN STORY</text></view>
    <view v-if="showNotice" class="notice">{{ noticeText }}</view>

    <view class="bottom-nav">
      <view v-for="item in navItems" :key="item.key" :class="['nav-item', { active: activeNav === item.key }]" @tap="selectNav(item.key, item.label)">
        <image class="nav-icon" :src="item.icon" />
        <text>{{ item.label }}</text>
      </view>
    </view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.home-page { padding-bottom: calc(128rpx + env(safe-area-inset-bottom)); background: #f8f7f4; }

/* 顶部品牌大图（去除顶部标题栏，沉浸式展示） */
.hero-section, .hero-swiper, .hero-slide { height: 960rpx; position: relative; }
.hero-slide { color: #fff; }
.hero-image { width: 100%; height: 100%; }
.hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.62)); }
.hero-copy { position: absolute; left: 46rpx; bottom: 120rpx; display: flex; flex-direction: column; }
.eyebrow { font-size: 19rpx; line-height: 1.4; letter-spacing: 3rpx; }
.eyebrow.dark { color: #8b8883; }
.hero-title { margin-top: 30rpx; white-space: pre-line; font-size: 58rpx; line-height: 1.28; letter-spacing: 5rpx; font-weight: 300; }
.hero-link { margin-top: 62rpx; display: flex; align-items: center; gap: 20rpx; font-size: 24rpx; letter-spacing: 2rpx; }
.hero-arrow { width: 26rpx; height: 26rpx; filter: invert(1); }
.hero-index { position: absolute; right: 44rpx; bottom: 42rpx; font-size: 20rpx; letter-spacing: 2rpx; }
.hero-dots { position: absolute; bottom: 47rpx; left: 50%; transform: translateX(-50%); display: flex; gap: 12rpx; }
.hero-dots text { display: block; width: 26rpx; height: 2rpx; background: rgba(255,255,255,.45); }
.hero-dots text.active { background: #fff; }

.section { padding: 90rpx 42rpx 0; }
.section-heading { display: flex; justify-content: space-between; align-items: flex-end; }
.section-title { display: block; margin-top: 16rpx; font-size: 37rpx; font-weight: 400; letter-spacing: 3rpx; }
.section-count { color: #a19c94; font-size: 17rpx; letter-spacing: 2rpx; }

/* 查看全部：仅文字，右对齐，无边框 */
.more-link { font-size: 23rpx; color: #171716; letter-spacing: 1rpx; padding-bottom: 6rpx; }
.more-arrow { font-size: 25rpx; }

/* 成品搭配 */
.look-scroll { width: calc(100% + 42rpx); margin-top: 38rpx; white-space: nowrap; }
.look-card { width: 278rpx; height: 278rpx; margin-right: 20rpx; position: relative; display: inline-block; vertical-align: top; overflow: hidden; background: #e9e6e0; }
.look-card image { width: 100%; height: 100%; }
.look-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,.55)); }
.look-label { position: absolute; z-index: 1; left: 22rpx; right: 22rpx; bottom: 20rpx; display: flex; justify-content: space-between; color: #fff; font-size: 18rpx; letter-spacing: 1rpx; }
.look-card.more { background: #eeece7; }
.look-card.more::after { display: none; }
.more-look { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #262522; font-size: 25rpx; letter-spacing: 3rpx; }
.more-icon { margin-bottom: 18rpx; font-size: 38rpx; }
.more-subtitle { margin-top: 12rpx; color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }

/* 商品推荐 */
.product-grid { margin-top: 38rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20rpx; row-gap: 46rpx; }
.product-card { min-width: 0; display: flex; flex-direction: column; }
.product-image-wrap { height: 385rpx; position: relative; background: #ebe8e2; }
.product-image-wrap > image { width: 100%; height: 100%; }
.product-name-row { min-width: 0; margin-top: 16rpx; display: flex; align-items: center; justify-content: space-between; gap: 8rpx; }
.product-name { min-width: 0; font-size: 23rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fav-button { flex: 0 0 48rpx; width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.fav-button image { width: 34rpx; height: 34rpx; }
.product-detail { margin-top: 4rpx; color: #96928b; font-size: 19rpx; }
.product-price { margin-top: 12rpx; font-size: 22rpx; }

/* 探索更多：六个入口，细线图标无边框 */
.feature-card { margin-top: 38rpx; display: grid; grid-template-columns: repeat(3, 1fr); row-gap: 50rpx; }
.feature-item { display: flex; flex-direction: column; align-items: center; }
.feature-icon { width: 52rpx; height: 52rpx; }
.feature-title { margin-top: 20rpx; font-size: 21rpx; letter-spacing: 1rpx; color: #292825; }

/* 积分展示 */
.points-card { margin-top: 80px; padding: 34rpx 32rpx; display: flex; justify-content: space-between; align-items: center; background: #171716; color: #fff; }
.points-label { display: block; font-size: 24rpx; letter-spacing: 2rpx; }
.points-tip { display: block; margin-top: 10rpx; color: rgba(255,255,255,.55); font-size: 19rpx; letter-spacing: 1rpx; }
.points-balance { display: flex; align-items: baseline; gap: 8rpx; }
.points-value { font-size: 44rpx; font-weight: 300; letter-spacing: 1rpx; }
.points-unit { color: rgba(255,255,255,.55); font-size: 19rpx; }
.points-login { display: flex; align-items: center; gap: 6rpx; font-size: 22rpx; letter-spacing: 1rpx; }
.points-login-arrow { font-size: 28rpx; }

.footer-mark { padding: 90rpx 0 160rpx; text-align: center; font-size: 30rpx; font-weight: 700; letter-spacing: 7rpx; }
.footer-mark span { font-weight: 400; }
.footer-mark text { display: block; margin-top: 18rpx; color: #a29d95; font-size: 15rpx; font-weight: 400; letter-spacing: 3rpx; }

.notice { position: fixed; left: 50%; bottom: 170rpx; transform: translateX(-50%); z-index: 20; padding: 22rpx 32rpx; background: rgba(23,23,22,.9); color: #fff; font-size: 22rpx; white-space: nowrap; }

/* 底部导航：仅图标 + 文字，无边框 */
.bottom-nav { position: fixed; z-index: 10; left: 0; right: 0; bottom: 0; padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); display: flex; justify-content: space-around; background: rgba(248,247,244,.97); border-top: 1px solid rgba(222,220,215,.6); }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; color: #9b968e; font-size: 19rpx; letter-spacing: 2rpx; }
.nav-item.active { color: #171716; }
.nav-item.active .nav-icon { filter: none; }
.nav-icon { width: 40rpx; height: 40rpx; opacity: .55; }
.nav-item.active .nav-icon { opacity: 1; }

@media (min-width: 700px) { .home-page { max-width: 540px; margin: 0 auto; box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
