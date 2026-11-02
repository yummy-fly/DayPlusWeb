<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, onMounted, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { fetchConsumptionRecords, fetchDiagnosisReports, fetchMemberProfile, markDiagnosisReportViewed, rechargeMemberCard, type ConsumptionRecord } from '../../api/profile'
import type { DiagnosisReport, MemberProfile } from '../../data/profile'
import { fetchFavoriteCollections, setLookFavorite, setProductFavorite } from '../../api/works'
import type { FavoriteCollections } from '../../api/works'

const moduleId = ref('')
const moduleTitle = ref('个人信息')
const loading = ref(true)
const favorites = ref<FavoriteCollections>({ looks: [], products: [] })
const consumptionRecords = ref<ConsumptionRecord[]>([])
const diagnosisReports = ref<DiagnosisReport[]>([])
const member = ref<MemberProfile | null>(null)
const archiveCategory = ref<'consumption' | 'diagnosis'>('consumption')
const openingReport = ref('')
const rechargeAmount = ref('')
const recharging = ref(false)
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
  if (moduleId.value === 'profile' || moduleId.value === 'favorites' || moduleId.value === 'archive') loadPage()
})

async function loadPage() {
  loading.value = true
  if (moduleId.value === 'profile') member.value = await fetchMemberProfile()
  if (moduleId.value === 'favorites') favorites.value = await fetchFavoriteCollections()
  if (moduleId.value === 'archive') {
    const [records, reports] = await Promise.all([fetchConsumptionRecords(), fetchDiagnosisReports()])
    consumptionRecords.value = records
    diagnosisReports.value = reports
  }
  loading.value = false
}

async function recharge() {
  const amount = Number(rechargeAmount.value)
  if (!amount || amount < 1 || recharging.value) {
    uni.showToast({ title: '请输入有效充值金额', icon: 'none' })
    return
  }
  recharging.value = true
  try {
    const result = await rechargeMemberCard(amount)
    if (member.value) member.value.balance = result.balance
    rechargeAmount.value = ''
    uni.showToast({ title: '充值成功', icon: 'success' })
  } catch (error) {
    console.error('[Member] recharge failed', error)
    uni.showToast({ title: '充值失败，请稍后重试', icon: 'none' })
  } finally {
    recharging.value = false
  }
}

async function openDiagnosisReport(report: DiagnosisReport) {
  openingReport.value = report.id
  try {
    const updated = await markDiagnosisReportViewed(report.id)
    const index = diagnosisReports.value.findIndex((item) => item.id === updated.id)
    if (index >= 0) diagnosisReports.value[index] = updated
    // #ifdef H5
    window.open(report.pdfUrl, '_blank', 'noopener,noreferrer')
    // #endif
    // #ifndef H5
    uni.downloadFile({
      url: report.pdfUrl,
      success: (result) => {
        if (result.statusCode === 200) {
          uni.openDocument({ filePath: result.tempFilePath, showMenu: true })
        } else {
          uni.showToast({ title: '报告暂时无法打开', icon: 'none' })
        }
      },
      fail: () => uni.showToast({ title: '报告暂时无法打开', icon: 'none' })
    })
    // #endif
  } finally {
    openingReport.value = ''
  }
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
    <template v-if="moduleId === 'profile'">
      <view v-if="loading" class="status">正在加载会员信息…</view>
      <template v-else-if="member">
        <view class="member-intro"><text class="eyebrow">DAY+ / MEMBER CARD</text><view class="member-head"><image class="member-avatar" :src="member.avatar" mode="aspectFill" /><view><text class="detail-title">{{ member.name }}</text><text class="member-no">会员卡号 {{ member.memberNo }}</text></view></view></view>
        <view class="member-card" @tap="navigate('/pages/member/levels')"><view class="member-card-top"><text class="card-brand">DAY+</text><text class="card-level">{{ member.level }}</text></view><text class="card-number">{{ member.memberNo }}</text><text class="card-caption">DAY+ STYLE MEMBER<text class="card-link">会员等级 ›</text></text></view>
        <view class="member-section"><view class="section-title-row"><text class="section-title">会员权益</text><text class="section-note">注册即享会员卡</text></view><view class="stats-grid"><view><text class="stat-value">{{ member.points.toLocaleString() }}</text><text class="stat-label">当前积分</text></view><view><text class="stat-value">¥{{ member.balance.toFixed(2) }}</text><text class="stat-label">会员余额</text></view></view><view class="progress-copy"><text>{{ member.nextLevel ? `距离${member.nextLevel}还差 ${member.nextLevelPoints! - member.points} 积分` : '恭喜您已达到最高等级' }}</text></view><view class="progress-track"><view class="progress-value" :style="{ width: `${member.nextLevel ? Math.min(100, member.points / member.nextLevelPoints! * 100) : 100}%` }" /></view></view>
        <view class="member-section recharge-section"><view class="section-title-row"><text class="section-title">会员卡充值</text><text class="section-note">余额可用于到店消费</text></view><view class="recharge-row"><input v-model="rechargeAmount" type="digit" placeholder="请输入充值金额" /><button :loading="recharging" @tap="recharge">充值</button></view><view class="quick-amounts"><text v-for="amount in [100, 300, 500, 1000]" :key="amount" @tap="rechargeAmount = String(amount)">¥{{ amount }}</text></view></view>
        <view class="member-section basic-section"><view class="section-title-row"><text class="section-title">基础信息</text></view><view class="info-row"><text>绑定手机</text><text>{{ member.phone }}</text></view><view class="info-row"><text>注册时间</text><text>{{ member.registeredAt }}</text></view></view>
      </template>
    </template>
    <template v-else-if="moduleId === 'favorites'">
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
      <view class="intro"><text class="eyebrow">DAY+ / PERSONAL ARCHIVE</text><text class="detail-title">我的档案</text><text class="detail-note">记录消费足迹，也记录每一次风格诊断。</text></view>
      <view class="archive-tabs"><text :class="['archive-tab', { active: archiveCategory === 'consumption' }]" @tap="archiveCategory = 'consumption'">消费档案</text><text :class="['archive-tab', { active: archiveCategory === 'diagnosis' }]" @tap="archiveCategory = 'diagnosis'">风格私档</text></view>
      <template v-if="archiveCategory === 'consumption'">
        <view v-if="loading" class="status">正在加载消费记录…</view>
        <view v-else-if="!consumptionRecords.length" class="status">暂无消费记录</view>
        <view v-else class="archive-list">
          <view v-for="record in consumptionRecords" :key="record.id" class="archive-card">
            <view class="archive-head"><view><text class="archive-date">{{ formatDate(record.purchasedAt) }}</text><text class="archive-store">{{ record.store }}</text></view><view class="archive-total"><text class="archive-total-label">消费金额</text><text class="archive-amount">¥ {{ money(record.amount) }}</text></view></view>
            <view class="archive-items"><view v-for="item in record.items" :key="`${record.id}-${item.name}`" class="archive-item"><view class="archive-item-copy"><text class="archive-item-name">{{ item.name }}</text><text class="archive-item-meta">{{ item.color }}　·　{{ item.size }}　·　×{{ item.quantity }}</text></view><text class="archive-item-price">¥ {{ money(item.price * item.quantity) }}</text></view></view>
          </view>
        </view>
      </template>
      <template v-else>
        <view v-if="loading" class="status">正在加载风格私档…</view>
        <view v-else class="report-list">
          <view v-for="report in diagnosisReports" :key="report.id" class="report-card">
            <view class="report-stamp" :class="{ viewed: report.viewed }"><image class="report-stamp-logo" src="/static/dayplus-logo.png" mode="aspectFit" /><text class="report-stamp-label">{{ report.viewed ? '已查看' : '待查看' }}</text></view>
            <view class="report-heading"><text class="report-type">{{ report.type }}</text><text class="report-title">{{ report.title }}</text></view>
            <text class="report-description">{{ report.description }}</text>
            <view class="report-footer"><text class="report-date">出具时间 {{ report.issuedAt }}</text><button class="report-button" :loading="openingReport === report.id" @tap="openDiagnosisReport(report)">{{ openingReport === report.id ? '打开中' : '查看详情' }}</button></view>
          </view>
        </view>
      </template>
    </template>
    <view v-else-if="!loading" class="empty-detail"><text class="eyebrow">DAY+ / {{ moduleId.toUpperCase() }}</text><text class="detail-title">{{ moduleTitle }}</text><text class="detail-note">功能页面正在准备中</text></view>
    <view v-else class="status">正在加载…</view>
    <FloatingCart v-if="moduleId !== 'profile'" />
  </view>
</template>

<style scoped>
.member-intro { padding: 58rpx 42rpx 34rpx; }.member-head { display: flex; align-items: center; gap: 24rpx; margin-top: 30rpx; }.member-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: #ebe8e2; }.member-head .detail-title { margin-top: 0; }.member-no { display: block; margin-top: 12rpx; color: #969189; font-size: 18rpx; }.member-card { margin: 0 42rpx 34rpx; padding: 34rpx; min-height: 210rpx; color: #f8f7f4; background: linear-gradient(135deg, #3d3b37, #171716); border-radius: 16rpx; }.member-card-top, .section-title-row, .recharge-row, .info-row { display: flex; align-items: center; justify-content: space-between; }.card-brand { font-size: 34rpx; letter-spacing: 5rpx; }.card-level { padding: 7rpx 16rpx; border: 1px solid rgba(255,255,255,.45); font-size: 18rpx; }.card-number { display: block; margin-top: 48rpx; font-size: 25rpx; letter-spacing: 4rpx; }.card-caption { display: block; margin-top: 16rpx; color: rgba(255,255,255,.6); font-size: 15rpx; letter-spacing: 3rpx; }.card-link { float: right; color: rgba(255,255,255,.85); letter-spacing: 2rpx; }.member-section { margin: 0 42rpx 24rpx; padding: 30rpx; background: #fdfcf9; border: 1px solid #dedcd7; }.section-title { font-size: 25rpx; }.section-note { color: #969189; font-size: 17rpx; }.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); margin: 34rpx 0 28rpx; }.stats-grid view + view { border-left: 1px solid #e5e2dc; padding-left: 28rpx; }.stat-value, .stat-label { display: block; }.stat-value { font-size: 32rpx; }.stat-label { margin-top: 8rpx; color: #969189; font-size: 17rpx; }.progress-copy { color: #77736d; font-size: 18rpx; }.progress-track { height: 8rpx; margin-top: 14rpx; background: #e9e6df; border-radius: 8rpx; overflow: hidden; }.progress-value { height: 100%; background: #9c845b; }.recharge-row { margin-top: 28rpx; gap: 16rpx; }.recharge-row input { flex: 1; height: 76rpx; padding: 0 22rpx; background: #f5f3ee; font-size: 22rpx; }.recharge-row button { width: 150rpx; height: 76rpx; padding: 0; display: flex; align-items: center; justify-content: center; box-sizing: border-box; color: #f8f7f4; background: #171716; font-size: 22rpx; line-height: 1; }.quick-amounts { display: flex; gap: 12rpx; margin-top: 18rpx; }.quick-amounts text { padding: 8rpx 18rpx; color: #8c7448; border: 1px solid #c8b998; font-size: 17rpx; }.info-row { padding: 22rpx 0; color: #77736d; font-size: 19rpx; border-bottom: 1px solid #e5e2dc; }.info-row:last-child { border-bottom: 0; padding-bottom: 0; }.info-row text:last-child { color: #171716; }
.detail-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 60rpx; background: #f8f7f4; color: #171716; }.topbar { height: 108rpx; padding: 0 30rpx; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 1px solid #e5e2dc; }.back { position: absolute; left: 30rpx; font-size: 60rpx; line-height: 1; font-weight: 200; transform: translateY(-4rpx); }.topbar-title { font-size: 28rpx; letter-spacing: 3rpx; }.intro { padding: 58rpx 42rpx 42rpx; }.eyebrow, .collection-kicker { color: #969189; font-size: 17rpx; letter-spacing: 3rpx; }.detail-title { display: block; margin-top: 22rpx; font-size: 42rpx; font-weight: 300; letter-spacing: 3rpx; }.detail-note { display: block; margin-top: 18rpx; color: #8c8881; font-size: 20rpx; }.category-scroll { width: 100%; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.category-list { display: inline-flex; padding: 25rpx 42rpx 23rpx; gap: 42rpx; white-space: nowrap; }.category { position: relative; color: #9b968e; font-size: 21rpx; letter-spacing: 2rpx; }.category.active { color: #171716; }.category.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -24rpx; height: 3rpx; background: #171716; }.collection-head { padding: 46rpx 42rpx 28rpx; display: flex; align-items: flex-end; justify-content: space-between; }.collection-title { display: block; margin-top: 10rpx; font-size: 30rpx; letter-spacing: 2rpx; }.collection-count { color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }.favorite-grid { padding: 0 42rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 38rpx 20rpx; }.image-wrap { height: 310rpx; overflow: hidden; background: #ebe8e2; }.image-wrap image { width: 100%; height: 100%; }.card-meta { padding-top: 16rpx; display: flex; justify-content: space-between; gap: 10rpx; }.card-code, .card-name, .card-price { display: block; }.card-code { color: #77736d; font-size: 17rpx; letter-spacing: 1rpx; }.card-name { margin-top: 8rpx; font-size: 20rpx; line-height: 1.4; }.card-price { margin-top: 10rpx; font-size: 19rpx; }.remove { flex: none; width: 42rpx; height: 42rpx; margin: -8rpx 0 0; padding: 0; background: transparent; color: #77736d; font-size: 32rpx; line-height: 42rpx; }.remove::after { border: 0; }.status { min-height: 300rpx; display: flex; align-items: center; justify-content: center; color: #8c8881; font-size: 21rpx; }.archive-tabs { display: flex; padding: 0 42rpx; border-bottom: 1px solid #dedcd7; }.archive-tab { position: relative; margin-right: 52rpx; padding: 0 0 22rpx; color: #969189; font-size: 21rpx; }.archive-tab.active { color: #171716; }.archive-tab.active::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 3rpx; background: #171716; content: ''; }.archive-list { padding: 28rpx 30rpx 0; }.archive-card { margin-bottom: 24rpx; padding: 30rpx; border: 1px solid #dedcd7; background: #fdfcf9; }.archive-head { display: flex; justify-content: space-between; gap: 20rpx; padding-bottom: 26rpx; border-bottom: 1px solid #e5e2dc; }.archive-date, .archive-store, .archive-total-label, .archive-amount { display: block; }.archive-date { color: #77736d; font-size: 18rpx; letter-spacing: 1rpx; }.archive-store { margin-top: 12rpx; font-size: 22rpx; }.archive-total { text-align: right; flex-shrink: 0; }.archive-total-label { color: #969189; font-size: 16rpx; }.archive-amount { margin-top: 9rpx; font-size: 25rpx; }.archive-item { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 24rpx 0 4rpx; }.archive-item-copy { min-width: 0; }.archive-item-name, .archive-item-meta { display: block; }.archive-item-name { font-size: 21rpx; line-height: 1.5; }.archive-item-meta { margin-top: 8rpx; color: #969189; font-size: 17rpx; }.archive-item-price { flex-shrink: 0; color: #77736d; font-size: 18rpx; }.report-list { padding: 28rpx 30rpx 0; }.report-card { position: relative; margin-bottom: 24rpx; padding: 34rpx 30rpx 30rpx; border: 1px solid #dedcd7; background: #fdfcf9; }.report-footer { display: flex; align-items: center; justify-content: space-between; }
.report-stamp { position: absolute; top: 22rpx; right: 24rpx; width: 122rpx; height: 122rpx; box-sizing: border-box; border: 2rpx solid #ad9670; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx; color: #92794f; background: #f6f1e8; transform: rotate(-12deg); }
.report-stamp.viewed { 
 border-color: #c6c2bb;
    color: #b9b9b9;
    background: #fdfcf9; }.report-stamp-logo { width: 76rpx; height: 35rpx; }.report-stamp.viewed .report-stamp-logo { opacity: .6; }.report-stamp-label { font-size: 17rpx; line-height: 1.3; letter-spacing: 2rpx; }.report-heading { min-height: 110rpx; padding-right: 140rpx; }.report-type { display: block; color: #8c7448; font-size: 17rpx; letter-spacing: 2rpx; }.report-title { display: block; margin-top: 12rpx; font-size: 27rpx; }.report-description { display: block; margin-top: 14rpx; color: #77736d; font-size: 18rpx; line-height: 1.6; }.report-footer { margin-top: 28rpx; padding-top: 22rpx; border-top: 1px solid #e5e2dc; }.report-date { color: #969189; font-size: 16rpx; }.report-button { width: 156rpx; height: 58rpx; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; box-sizing: border-box; color: #f8f7f4; background: #171716; font-size: 18rpx; line-height: 1; }.report-button::after { border: 0; }.empty-detail { min-height: 62vh; padding: 120rpx 42rpx; display: flex; flex-direction: column; justify-content: center; }
</style>
