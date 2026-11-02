<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import FloatingCart from '../../components/FloatingCart.vue'
import { afterSaleStatuses, cancelOrder, fetchOrders, orderStatusLabel, orderTabs, payOrder, requestOrderRefund } from '../../api/order'
import type { OrderFilter, OrderRecord, OrderStatus } from '../../api/order'

const orders = ref<OrderRecord[]>([])
const activeStatus = ref<OrderFilter>('all')
const selected = ref<OrderRecord | null>(null)
const loading = ref(true)
const failed = ref(false)
const submitting = ref(false)
const visibleOrders = computed(() => orders.value.filter((item) => activeStatus.value === 'all' || (activeStatus.value === 'after-sale' ? ['refund-requested', 'refunded'].includes(item.status) : item.status === activeStatus.value)))
const canPay = computed(() => selected.value?.status === 'pending-payment')
const canCancel = computed(() => selected.value && ['pending-payment', 'pending-shipment'].includes(selected.value.status))
const canRefund = computed(() => selected.value && ['shipped', 'completed'].includes(selected.value.status))

onLoad((query) => {
  if (orderTabs.some((tab) => tab.key === query?.status)) activeStatus.value = query?.status as OrderFilter
  if (query?.status === 'after-sale' || afterSaleStatuses.some((status) => status.key === query?.status)) activeStatus.value = query?.status as OrderFilter
})
onShow(loadPage)

async function loadPage() {
  loading.value = true
  failed.value = false
  try {
    orders.value = await fetchOrders()
    if (selected.value) selected.value = orders.value.find((item) => item.id === selected.value?.id) ?? null
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function goBack() {
  if (selected.value) {
    selected.value = null
    return
  }
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/profile/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/profile/index' })
  // #endif
}

function confirmPayment() {
  if (!selected.value || submitting.value) return
  uni.showModal({
    title: '模拟支付',
    content: `确认支付 ¥${money(selected.value.amount)} 吗？`,
    confirmText: '确认支付',
    success: (result) => { if (result.confirm) submitPayment() }
  })
}

async function submitPayment() {
  if (!selected.value || submitting.value) return
  submitting.value = true
  try {
    const orderId = selected.value.id
    const result = await payOrder(orderId)
    if (!result.success) throw new Error('支付失败')
    await loadPage()
    selected.value = orders.value.find((item) => item.id === orderId) ?? null
    uni.showToast({ title: '支付成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '支付失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function confirmAction(action: 'cancel' | 'refund') {
  if (submitting.value || !selected.value) return
  uni.showModal({
    title: action === 'cancel' ? '取消订单' : '申请退货退款',
    content: action === 'cancel' ? '确定取消该订单吗？已支付订单将模拟原路退款。' : '确定对该订单全部商品申请退货退款吗？提交后将进入审核。',
    confirmText: action === 'cancel' ? '确认取消' : '提交申请',
    success: (result) => { if (result.confirm) submitAction(action) }
  })
}

async function submitAction(action: 'cancel' | 'refund') {
  if (!selected.value || submitting.value) return
  submitting.value = true
  try {
    const result = action === 'cancel' ? await cancelOrder(selected.value.id) : await requestOrderRefund(selected.value.id)
    if (!result.success) throw new Error('操作失败')
    await loadPage()
    activeStatus.value = action === 'cancel' ? 'all' : 'refund-requested'
    uni.showToast({ title: action === 'cancel' ? '订单已取消' : '申请已提交', icon: 'success' })
  } catch {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="orders-page">
    <view class="topbar"><view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view><text>{{ selected ? '订单详情' : '我的订单' }}</text></view>
    <template v-if="!selected">
      <view class="intro"><text class="eyebrow">DAY+ / MY ORDERS</text><text class="title">我的订单</text><text class="note">每一份选择，都是日常风格的延续。</text></view>
      <scroll-view scroll-x class="tab-scroll"><view class="tabs"><button :class="['tab', { active: activeStatus === 'all' }]" @tap="activeStatus = 'all'">全部<text>{{ orders.length }}</text></button><button v-for="tab in orderTabs" :key="tab.key" :class="['tab', { active: activeStatus === tab.key }]" @tap="activeStatus = tab.key">{{ tab.label }}<text>{{ orders.filter((item) => item.status === tab.key).length }}</text></button><button :class="['tab', { active: activeStatus === 'after-sale' || afterSaleStatuses.some((status) => status.key === activeStatus) }]" @tap="activeStatus = 'after-sale'">售后<text>{{ orders.filter((item) => ['refund-requested', 'refunded'].includes(item.status)).length }}</text></button></view></scroll-view>
      <view v-if="activeStatus === 'after-sale' || afterSaleStatuses.some((status) => status.key === activeStatus)" class="sub-tabs"><button v-for="status in afterSaleStatuses" :key="status.key" :class="['sub-tab', { active: activeStatus === status.key }]" @tap="activeStatus = status.key">{{ status.label }}<text>{{ orders.filter((item) => item.status === status.key).length }}</text></button></view>
      <view v-if="loading" class="empty">正在加载订单…</view>
      <view v-else-if="failed" class="empty"><text>订单加载失败</text><button class="action" @tap="loadPage">重新加载</button></view>
      <view v-else-if="!visibleOrders.length" class="empty">暂无相关订单</view>
      <view v-else class="order-list">
        <view v-for="order in visibleOrders" :key="order.id" class="order-card" @tap="selected = order">
          <view class="card-head"><text>{{ order.orderNo }}</text><text class="status-label">{{ orderStatusLabel(order.status) }}</text></view>
          <view v-for="item in order.items" :key="item.id" class="product-row"><image :src="item.image" mode="aspectFill" /><view class="product-info"><text class="product-name">{{ item.name }}</text><text class="muted">{{ item.color }} · {{ item.size }}</text><view class="product-price"><text>¥ {{ money(item.price) }}</text><text class="muted">× {{ item.quantity }}</text></view></view></view>
          <view class="card-foot"><text>共 {{ order.items.reduce((sum, item) => sum + item.quantity, 0) }} 件</text><text>订单金额 <text class="amount">¥ {{ money(order.amount) }}</text></text></view>
          <view class="card-link"><text>{{ formatDate(order.createdAt) }}</text><text>查看详情　›</text></view>
        </view>
      </view>
    </template>
    <template v-else>
      <view class="intro detail-intro"><text class="eyebrow">DAY+ / ORDER DETAIL</text><text class="title">{{ orderStatusLabel(selected.status) }}</text><text class="note">{{ selected.logisticsStatus }}</text></view>
      <view class="section"><text class="section-title">收货信息</text><text class="recipient">{{ selected.shipping.recipient }}　{{ selected.shipping.phone }}</text><text class="address">{{ selected.shipping.address }}</text></view>
      <view class="section"><text class="section-title">商品明细</text><view v-for="item in selected.items" :key="item.id" class="product-row"><image :src="item.image" mode="aspectFill" /><view class="product-info"><text class="product-name">{{ item.name }}</text><text class="muted">{{ item.color }} · {{ item.size }}</text><view class="product-price"><text>¥ {{ money(item.price) }}</text><text class="muted">× {{ item.quantity }}</text></view><text class="line-total">小计 ¥ {{ money(item.price * item.quantity) }}</text></view></view></view>
      <view class="section"><text class="section-title">订单金额</text><view class="info-row"><text>商品总额</text><text>¥ {{ money(selected.subtotal) }}</text></view><view class="info-row"><text>优惠金额</text><text>− ¥ {{ money(selected.discount) }}</text></view><view class="info-row"><text>配送费用</text><text>¥ 0.00</text></view><view class="info-row total"><text>{{ selected.status === 'pending-payment' ? '待支付金额' : '订单金额' }}</text><text>¥ {{ money(selected.amount) }}</text></view></view>
      <view class="section"><text class="section-title">物流信息</text><view class="info-row"><text>物流单号</text><text>{{ selected.logisticsNo || '暂未生成' }}</text></view><view class="info-row"><text>物流状态</text><text>{{ selected.logisticsStatus }}</text></view></view>
      <view class="section"><text class="section-title">订单信息</text><view class="info-row"><text>订单编号</text><text>{{ selected.orderNo }}</text></view><view class="info-row"><text>创建时间</text><text>{{ formatDate(selected.createdAt) }}</text></view><view class="info-row"><text>订单状态</text><text>{{ orderStatusLabel(selected.status) }}</text></view></view>
      <view v-if="canPay || canCancel || canRefund" class="action-bar"><button v-if="canPay" class="action primary-action" :disabled="submitting" @tap="confirmPayment">{{ submitting ? '处理中…' : '立即支付' }}</button><button v-if="canCancel || canRefund" class="action secondary-action" :disabled="submitting" @tap="confirmAction(canCancel ? 'cancel' : 'refund')">{{ canCancel ? '取消订单' : '申请退货退款' }}</button></view>
    </template>
    <view class="footer">DAY+ / WEAR YOUR OWN STORY</view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.orders-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 5rpx; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }
.intro { padding: 52rpx 36rpx 38rpx; }.eyebrow { color: #969189; font-size: 17rpx; letter-spacing: 3rpx; }.title { display: block; margin-top: 18rpx; font-size: 40rpx; font-weight: 300; letter-spacing: 3rpx; }.note { display: block; margin-top: 18rpx; color: #8c8881; font-size: 20rpx; line-height: 1.7; }
.tab-scroll { width: 100%; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; }.tabs { display: inline-flex; padding: 0 30rpx; gap: 30rpx; white-space: nowrap; }.tab { flex-shrink: 0; margin: 0; padding: 24rpx 0; border-radius: 0; background: transparent; color: #969189; font-size: 21rpx; line-height: 1.6; }.tab::after { border: 0; }.tab.active { color: #171716; border-bottom: 3rpx solid #171716; }.tab text { margin-left: 8rpx; font-size: 16rpx; }.sub-tabs { display: flex; gap: 18rpx; padding: 22rpx 30rpx 0; }.sub-tab { flex: 1; margin: 0; padding: 16rpx 12rpx; border: 1px solid #dedcd7; border-radius: 0; background: transparent; color: #969189; font-size: 19rpx; }.sub-tab::after { border: 0; }.sub-tab.active { border-color: #171716; color: #171716; background: #fdfcf9; }.sub-tab text { margin-left: 8rpx; font-size: 16rpx; }
.order-list { padding: 30rpx; }.order-card { margin-bottom: 24rpx; padding: 24rpx; border: 1px solid #dedcd7; background: #fdfcf9; }.card-head { display: flex; justify-content: space-between; align-items: center; gap: 12rpx; padding-bottom: 8rpx; color: #969189; font-size: 17rpx; }.status-label { color: #756b5b; background: #eee9e0; padding: 8rpx 12rpx; flex-shrink: 0; }
.product-row { display: flex; gap: 22rpx; padding: 24rpx 0; border-bottom: 1px solid #e5e2dc; }.product-row image { width: 140rpx; height: 176rpx; flex-shrink: 0; background: #ebe8e2; }.product-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12rpx; }.product-name { font-size: 23rpx; line-height: 1.5; }.muted { color: #969189; font-size: 18rpx; }.product-price { margin-top: auto; display: flex; justify-content: space-between; gap: 14rpx; font-size: 21rpx; }.line-total { font-size: 18rpx; color: #77736c; }
.card-foot { display: flex; justify-content: space-between; align-items: baseline; padding: 24rpx 0; font-size: 18rpx; color: #77736c; }.amount { color: #171716; font-size: 24rpx; margin-left: 10rpx; }.card-link { display: flex; justify-content: space-between; border-top: 1px solid #e5e2dc; padding-top: 20rpx; font-size: 17rpx; color: #969189; }.card-link text:last-child { color: #171716; }
.section { margin: 0 36rpx; padding: 32rpx 0; border-bottom: 1px solid #dedcd7; }.section-title { display: block; margin-bottom: 22rpx; font-size: 24rpx; letter-spacing: 2rpx; }.recipient { display: block; font-size: 21rpx; }.address { display: block; margin-top: 16rpx; color: #77736c; font-size: 20rpx; line-height: 1.7; }.section .product-row:last-child { border-bottom: 0; padding-bottom: 0; }.info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 26rpx; padding: 14rpx 0; font-size: 20rpx; line-height: 1.6; }.info-row > text:first-child { color: #969189; flex-shrink: 0; }.info-row > text:last-child { text-align: right; overflow-wrap: anywhere; }.info-row.total { margin-top: 16rpx; padding-top: 24rpx; border-top: 1px solid #dedcd7; font-size: 25rpx; }.info-row.total > text:first-child { color: #171716; }
.action-bar { position: fixed; z-index: 5; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 540px; box-sizing: border-box; padding: 20rpx 36rpx calc(20rpx + env(safe-area-inset-bottom)); background: #f8f7f4; border-top: 1px solid #dedcd7; }.action { height: 78rpx; flex: 1; margin: 0; padding: 0 30rpx; border-radius: 0; background: #171716; color: #fff; font-size: 22rpx; line-height: 78rpx; }.action::after { border: 0; }.secondary-action { background: transparent; border: 1px solid #171716; color: #171716; }.action-bar { display: flex; gap: 18rpx; }.action[disabled] { background: #bcb8b0; color: #fff; }.empty { min-height: 360rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24rpx; color: #8c8881; font-size: 21rpx; }.footer { padding: 50rpx 0; text-align: center; color: #a29d95; font-size: 15rpx; letter-spacing: 3rpx; }
</style>
