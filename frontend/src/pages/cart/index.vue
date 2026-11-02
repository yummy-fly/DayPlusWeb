<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createOrder, fetchCartItems, fetchRedeemedVouchers, removeCartItem, updateCartItem } from '../../api/cart'
import { createAddress, fetchAddresses } from '../../api/address'
import type { AddressItem } from '../../data/address'
import type { CartItem, RedeemedVoucher, ShippingInfo } from '../../data/cart'
import RegionPicker from '../../components/RegionPicker.vue'

const items = ref<CartItem[]>([])
const selectedIds = ref<string[]>([])
const vouchers = ref<RedeemedVoucher[]>([])
const addresses = ref<AddressItem[]>([])
const selectedAddressId = ref('')
const voucherId = ref('')
const loading = ref(true)
const submitting = ref(false)
const savingAddress = ref(false)
const showAddressForm = ref(false)
const step = ref<'cart' | 'checkout' | 'done'>('cart')
const orderNo = ref('')
const shipping = ref<ShippingInfo>({ recipient: '', phone: '', address: '' })
const newAddress = ref({ name: '', phone: '', region: ['', '', ''], detail: '', remark: '' })
const selectedItems = computed(() => items.value.filter((item) => selectedIds.value.includes(item.id)))
const selectedVoucher = computed(() => vouchers.value.find((item) => item.id === voucherId.value) ?? null)
const selectedAddress = computed(() => addresses.value.find((item) => item.id === selectedAddressId.value) ?? null)
const subtotal = computed(() => selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const discount = computed(() => selectedVoucher.value?.value ?? 0)
const total = computed(() => Math.max(0, subtotal.value - discount.value))
const allSelected = computed(() => items.value.length > 0 && selectedIds.value.length === items.value.length)

onLoad(loadCart)

async function loadCart() {
  loading.value = true
  try {
    const [cart, availableVouchers, savedAddresses] = await Promise.all([fetchCartItems(), fetchRedeemedVouchers(), fetchAddresses()])
    items.value = cart
    vouchers.value = availableVouchers
    addresses.value = savedAddresses
    selectedAddressId.value = savedAddresses[0]?.id ?? ''
    if (savedAddresses[0]) applyAddress(savedAddresses[0])
    selectedIds.value = cart.map((item) => item.id)
  } catch {
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function toggleItem(id: string) {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((value) => value !== id) : [...selectedIds.value, id]
}

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : items.value.map((item) => item.id)
}

async function changeQuantity(item: CartItem, delta: number) {
  const quantity = Math.max(1, item.quantity + delta)
  if (quantity === item.quantity) return
  items.value = await updateCartItem(item.id, quantity)
}

async function deleteItem(item: CartItem) {
  items.value = await removeCartItem(item.id)
  selectedIds.value = selectedIds.value.filter((id) => id !== item.id)
}

function beginCheckout() {
  if (!selectedItems.value.length) {
    uni.showToast({ title: '请先选择商品', icon: 'none' })
    return
  }
  step.value = 'checkout'
}

function applyAddress(address: AddressItem) {
  selectedAddressId.value = address.id
  shipping.value = { recipient: address.name, phone: address.phone, address: `${address.region.join(' ')} ${address.detail}` }
  showAddressForm.value = false
}

function openNewAddress() {
  newAddress.value = { name: '', phone: '', region: ['', '', ''], detail: '', remark: '' }
  showAddressForm.value = true
}

async function saveNewAddress() {
  if (savingAddress.value) return
  if (!newAddress.value.name.trim() || !/^1\d{10}$/.test(newAddress.value.phone) || newAddress.value.region.some((item) => !item) || !newAddress.value.detail.trim()) {
    uni.showToast({ title: '请填写完整收货信息', icon: 'none' })
    return
  }
  savingAddress.value = true
  try {
    const saved = await createAddress({ ...newAddress.value, name: newAddress.value.name.trim(), detail: newAddress.value.detail.trim(), remark: newAddress.value.remark.trim() })
    addresses.value = saved
    const address = saved[saved.length - 1]
    if (address) applyAddress(address)
    uni.showToast({ title: '地址已保存', icon: 'success' })
  } finally {
    savingAddress.value = false
  }
}

function validateShipping() {
  if (!selectedAddress.value || !shipping.value.recipient.trim() || (!/^1\d{10}$/.test(shipping.value.phone) && !/^1\d{2}\*{4}\d{4}$/.test(shipping.value.phone)) || !shipping.value.address.trim()) {
    uni.showToast({ title: '请填写完整收货信息', icon: 'none' })
    return false
  }
  return true
}

async function submitOrder() {
  if (submitting.value || !validateShipping()) return
  submitting.value = true
  try {
    const result = await createOrder(selectedItems.value, selectedVoucher.value, shipping.value)
    orderNo.value = result.orderNo
    const orderedIds = new Set(selectedItems.value.map((item) => item.id))
    items.value = items.value.filter((item) => !orderedIds.has(item.id))
    selectedIds.value = []
    if (selectedVoucher.value) vouchers.value = vouchers.value.filter((item) => item.id !== selectedVoucher.value?.id)
    voucherId.value = ''
    step.value = 'done'
  } catch {
    uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (step.value === 'done') {
    loadCart()
    step.value = 'cart'
    return
  }
  if (step.value === 'checkout') {
    step.value = 'cart'
    return
  }
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/home/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/home/index' })
  // #endif
}

function returnToCart() {
  loadCart()
  step.value = 'cart'
}

function goHome() {
  // #ifdef H5
  window.location.assign(`${window.location.pathname}#/pages/home/index`)
  // #endif
  // #ifndef H5
  uni.redirectTo({ url: '/pages/home/index' })
  // #endif
}
</script>

<template>
  <view class="cart-page">
    <view class="topbar"><view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view><text>{{ step === 'checkout' ? '确认订单' : step === 'done' ? '订单完成' : '购物袋' }}</text><text class="topbar-count">{{ step === 'cart' ? `${items.length} ITEMS` : 'DAY+ ORDER' }}</text></view>

    <template v-if="step === 'cart'">
      <view class="page-heading"><text class="eyebrow">DAY+ / YOUR SELECTION</text><text class="title">购物袋</text></view>
      <view v-if="loading" class="empty-state">正在加载购物袋…</view>
      <view v-else-if="!items.length" class="empty-state"><text>购物袋还是空的</text><button class="primary-button" @tap="goHome">继续探索</button></view>
      <template v-else>
        <view class="item-list">
          <view v-for="item in items" :key="item.id" class="cart-item">
            <view :class="['checkbox', { checked: selectedIds.includes(item.id) }]" role="checkbox" :aria-checked="selectedIds.includes(item.id)" @tap="toggleItem(item.id)"><text v-if="selectedIds.includes(item.id)">✓</text></view>
            <image class="item-image" :src="item.image" mode="aspectFill" :alt="item.name" />
            <view class="item-info"><text class="item-category">{{ item.category }} / DAY+ EDITION</text><text class="item-name">{{ item.name }}</text><text class="item-options">{{ item.color }}　·　{{ item.size }}</text><view class="item-bottom"><text class="item-price">¥ {{ item.price.toLocaleString('en-US') }}</text><view class="quantity-control"><button :disabled="item.quantity <= 1" @tap="changeQuantity(item, -1)">−</button><text>{{ item.quantity }}</text><button @tap="changeQuantity(item, 1)">+</button></view></view><text class="remove" @tap="deleteItem(item)">移除</text></view>
          </view>
        </view>
        <view class="select-all-row"><view class="select-all" @tap="toggleAll"><view :class="['checkbox', { checked: allSelected }]"><text v-if="allSelected">✓</text></view><text>全选</text></view><text>{{ selectedItems.length }} 件商品</text></view>
        <view class="summary"><text>商品金额</text><text>¥ {{ subtotal.toLocaleString('en-US') }}</text></view>
        <view class="checkout-bar"><view><text class="total-label">合计</text><text class="total-price">¥ {{ total.toLocaleString('en-US') }}</text></view><button class="primary-button" :disabled="!selectedItems.length" @tap="beginCheckout">去结算（{{ selectedItems.length }}）</button></view>
      </template>
    </template>

    <template v-else-if="step === 'checkout'">
      <view class="page-heading"><text class="eyebrow">DAY+ / DELIVERY</text><text class="title">收货信息</text></view>
      <view class="address-section"><view class="section-title"><text>选择收货地址</text><text class="address-add" @tap="openNewAddress">＋ 新建地址</text></view><view v-if="addresses.length" class="saved-addresses"><view v-for="item in addresses" :key="item.id" :class="['saved-address', { selected: selectedAddressId === item.id }]" @tap="applyAddress(item)"><view class="address-radio">{{ selectedAddressId === item.id ? '✓' : '' }}</view><view><text class="saved-address-name">{{ item.name }}　{{ item.phone }}</text><text class="saved-address-detail">{{ item.region.join(' ') }} {{ item.detail }}</text></view></view></view><view v-else class="no-address">暂无收货地址，请先新建</view></view>
      <view v-if="showAddressForm" class="shipping-form"><view class="form-caption">新建收货地址</view><label class="field"><text>收件人</text><input v-model="newAddress.name" placeholder="请输入收件人姓名" /></label><label class="field"><text>联系电话</text><input v-model="newAddress.phone" type="number" maxlength="11" placeholder="请输入手机号" /></label><view class="field region-field"><text>所在地区</text><RegionPicker v-model="newAddress.region" /></view><label class="field address-field"><text>详细地址</text><textarea v-model="newAddress.detail" placeholder="请输入详细收货地址" /></label><view class="address-form-actions"><button class="cancel-address" @tap="showAddressForm = false">取消</button><button class="save-address" :disabled="savingAddress" @tap="saveNewAddress">{{ savingAddress ? '保存中…' : '保存并使用' }}</button></view></view>
      <view class="checkout-section"><view class="section-title"><text>商品清单</text><text>{{ selectedItems.length }} 件</text></view><view v-for="item in selectedItems" :key="item.id" class="checkout-item"><image :src="item.image" mode="aspectFill" /><view><text>{{ item.name }}</text><text class="checkout-options">{{ item.color }} · {{ item.size }} · ×{{ item.quantity }}</text></view><text class="checkout-price">¥ {{ (item.price * item.quantity).toLocaleString('en-US') }}</text></view></view>
      <view v-if="vouchers.length" class="voucher-section"><text class="section-label">代金券</text><picker :range="['不使用', ...vouchers.map((item) => `${item.name} -¥${item.value}`)]" :value="Math.max(0, vouchers.findIndex((item) => item.id === voucherId) + 1)" @change="voucherId = $event.detail.value === 0 ? '' : vouchers[$event.detail.value - 1].id"><view class="voucher-picker"><text>{{ selectedVoucher ? `${selectedVoucher.name}　-¥${selectedVoucher.value}` : '选择可用代金券' }}</text><text>›</text></view></picker></view>
      <view class="amount-breakdown"><view><text>商品金额</text><text>¥ {{ subtotal.toLocaleString('en-US') }}</text></view><view v-if="selectedVoucher"><text>代金券优惠</text><text class="discount">− ¥ {{ discount }}</text></view><view class="amount-total"><text>实付金额</text><text>¥ {{ total.toLocaleString('en-US') }}</text></view></view>
      <view class="checkout-bar"><view><text class="total-label">模拟支付</text><text class="total-price">¥ {{ total.toLocaleString('en-US') }}</text></view><button class="primary-button" :disabled="submitting" @tap="submitOrder">{{ submitting ? '提交中…' : '提交订单' }}</button></view>
    </template>

    <view v-else class="success-state"><view class="success-mark">✓</view><text class="success-title">订单已生成</text><text class="success-subtitle">模拟支付已完成，无需微信支付</text><view class="order-number"><text>订单编号</text><text>{{ orderNo }}</text></view><button class="primary-button" @tap="returnToCart">返回购物袋</button></view>
    <view v-if="step !== 'done'" class="footer"><image class="footer-brand" src="/static/dayplus-logo.png" mode="aspectFit" /><text>日常之中，自有风格。</text></view>
  </view>
</template>

<style scoped>
.cart-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: calc(170rpx + env(safe-area-inset-bottom)); background: #f8f7f4; color: #171716; }
.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 4rpx; }
.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }.topbar-count { position: absolute; right: 30rpx; color: #99958e; font-size: 15rpx; letter-spacing: 2rpx; }
.page-heading { padding: 48rpx 36rpx 30rpx; }.eyebrow { color: #8b8883; font-size: 17rpx; letter-spacing: 3rpx; }.title { display: block; margin-top: 14rpx; font-size: 38rpx; font-weight: 300; letter-spacing: 3rpx; }
.item-list { padding: 0 30rpx; }.cart-item { position: relative; display: flex; align-items: flex-start; gap: 18rpx; padding: 24rpx 0; border-bottom: 1px solid #dedcd7; }.checkbox { flex: 0 0 34rpx; width: 34rpx; height: 34rpx; margin-top: 118rpx; border: 1px solid #bcb8b0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 21rpx; }.checkbox.checked { border-color: #171716; background: #171716; }.item-image { flex: 0 0 210rpx; width: 210rpx; height: 270rpx; background: #ebe8e2; }.item-info { position: relative; min-width: 0; flex: 1; min-height: 270rpx; display: flex; flex-direction: column; align-items: flex-start; }.item-category { color: #969189; font-size: 14rpx; letter-spacing: 1rpx; }.item-name { margin-top: 15rpx; font-size: 22rpx; line-height: 1.5; }.item-options { margin-top: 10rpx; color: #77736c; font-size: 18rpx; }.item-bottom { width: 100%; margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 8rpx; }.item-price { font-size: 21rpx; }.quantity-control { display: flex; align-items: center; height: 48rpx; border: 1px solid #d5d2cc; }.quantity-control button { width: 44rpx; height: 46rpx; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; font-size: 25rpx; line-height: 46rpx; }.quantity-control button::after { border: 0; }.quantity-control text { min-width: 34rpx; text-align: center; font-size: 18rpx; }.remove { margin-top: 16rpx; color: #969189; font-size: 17rpx; text-decoration: underline; text-underline-offset: 4rpx; }
.select-all-row { margin: 0 30rpx; padding: 24rpx 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dedcd7; color: #77736c; font-size: 18rpx; }.select-all { display: flex; align-items: center; gap: 12rpx; }.select-all .checkbox { margin: 0; }.summary { margin: 0 30rpx; padding: 25rpx 0; display: flex; justify-content: space-between; color: #77736c; font-size: 19rpx; }.checkout-bar { position: fixed; z-index: 4; bottom: 0; left: 50%; transform: translateX(-50%); width: min(100%, 540px); padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom)); box-sizing: border-box; display: flex; justify-content: space-between; align-items: center; background: rgba(248,247,244,.98); border-top: 1px solid #dedcd7; }.checkout-bar > view { display: flex; flex-direction: column; gap: 6rpx; }.total-label { color: #8b8883; font-size: 16rpx; }.total-price { font-size: 25rpx; }.primary-button { min-width: 220rpx; height: 78rpx; margin: 0; padding: 0 28rpx; border: 0; border-radius: 0; display: flex; align-items: center; justify-content: center; background: #171716; color: #f8f7f4; font-size: 21rpx; letter-spacing: 1rpx; }.primary-button::after { border: 0; }.primary-button[disabled] { background: #c8c4bd; color: #fff; }
.address-section { margin: 0 30rpx; }.address-section .section-title { padding-bottom: 16rpx; }.address-add { color: #77736c; font-size: 18rpx; }.saved-addresses { display: flex; flex-direction: column; gap: 12rpx; }.saved-address { display: flex; gap: 16rpx; padding: 20rpx; background: #fdfcf9; border: 1px solid #dedcd7; }.saved-address.selected { border-color: #171716; }.address-radio { flex: 0 0 32rpx; width: 32rpx; height: 32rpx; border: 1px solid #bcb8b0; display: flex; align-items: center; justify-content: center; font-size: 18rpx; }.saved-address.selected .address-radio { color: #fff; background: #171716; border-color: #171716; }.saved-address-name, .saved-address-detail { display: block; }.saved-address-name { font-size: 19rpx; }.saved-address-detail { margin-top: 8rpx; color: #77736c; font-size: 17rpx; line-height: 1.5; }.no-address { padding: 24rpx; color: #969189; background: #fdfcf9; border: 1px solid #dedcd7; font-size: 18rpx; }.shipping-form { margin: 18rpx 30rpx 0; padding: 0 24rpx; background: #fdfcf9; border: 1px solid #dedcd7; }.form-caption { padding: 22rpx 0 8rpx; font-size: 20rpx; }.field { min-height: 94rpx; display: flex; align-items: center; gap: 24rpx; border-bottom: 1px solid #e5e2dd; font-size: 20rpx; }.field:last-child { border-bottom: 0; }.field > text { flex: 0 0 130rpx; }.field input { flex: 1; font-size: 19rpx; }.address-field { align-items: flex-start; padding: 25rpx 0; }.address-field textarea { flex: 1; min-height: 105rpx; font-size: 19rpx; line-height: 1.6; }.region-field { display: block; padding: 18rpx 0; }.region-field > text { display: block; margin-bottom: 12rpx; }.address-form-actions { display: flex; gap: 12rpx; padding: 20rpx 0; }.address-form-actions button { height: 68rpx; margin: 0; border-radius: 0; font-size: 18rpx; }.cancel-address { flex: 0 0 30%; border: 1px solid #171716; background: transparent; }.save-address { flex: 1; background: #171716; color: #fff; }.save-address[disabled] { background: #bcb8b0; }.cancel-address::after, .save-address::after { border: 0; }
.checkout-section { padding: 42rpx 30rpx 0; }.section-title { display: flex; justify-content: space-between; padding-bottom: 18rpx; border-bottom: 1px solid #dedcd7; font-size: 21rpx; }.section-title text:last-child { color: #969189; }.checkout-item { display: flex; align-items: center; gap: 16rpx; padding: 18rpx 0; border-bottom: 1px solid #e5e2dd; }.checkout-item image { width: 92rpx; height: 112rpx; background: #ebe8e2; }.checkout-item > view { flex: 1; display: flex; flex-direction: column; gap: 12rpx; font-size: 19rpx; }.checkout-options { color: #969189; font-size: 16rpx; }.checkout-price { font-size: 18rpx; }.voucher-section { padding: 30rpx; }.section-label { display: block; margin-bottom: 15rpx; font-size: 20rpx; }.voucher-picker { padding: 21rpx 18rpx; display: flex; justify-content: space-between; border: 1px solid #dedcd7; background: #fdfcf9; font-size: 18rpx; }.amount-breakdown { margin: 0 30rpx 35rpx; padding: 20rpx 0; border-top: 1px solid #dedcd7; }.amount-breakdown > view { display: flex; justify-content: space-between; padding: 12rpx 0; color: #77736c; font-size: 18rpx; }.amount-breakdown .amount-total { margin-top: 8rpx; padding-top: 22rpx; border-top: 1px solid #dedcd7; color: #171716; font-size: 21rpx; }.discount { color: #6e7a68; }
.empty-state { min-height: 48vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28rpx; color: #8b8883; font-size: 21rpx; }.success-state { min-height: 78vh; padding: 40rpx 36rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }.success-mark { width: 96rpx; height: 96rpx; border: 1px solid #171716; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 42rpx; }.success-title { margin-top: 30rpx; font-size: 32rpx; letter-spacing: 3rpx; }.success-subtitle { margin-top: 14rpx; color: #8b8883; font-size: 18rpx; }.order-number { width: 100%; margin: 48rpx 0 32rpx; padding: 20rpx 0; display: flex; justify-content: space-between; border-top: 1px solid #dedcd7; border-bottom: 1px solid #dedcd7; color: #77736c; font-size: 18rpx; }.footer { padding: 50rpx 0 20rpx; display: flex; flex-direction: column; align-items: center; gap: 14rpx; color: #9b968e; font-size: 17rpx; letter-spacing: 2rpx; }.footer-brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }
@media (min-width: 700px) { .cart-page { box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
