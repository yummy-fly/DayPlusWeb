<script setup lang="ts">
import FloatingCart from '../../components/FloatingCart.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '../../api/address'
import type { AddressItem } from '../../data/address'
import RegionPicker from '../../components/RegionPicker.vue'

type FormState = Omit<AddressItem, 'id'>

const addresses = ref<AddressItem[]>([])
const loading = ref(true)
const saving = ref(false)
const editingId = ref('')
const showForm = ref(false)
const form = ref<FormState>(emptyForm())
const regionText = computed(() => form.value.region.filter(Boolean).join(' '))

function emptyForm(): FormState {
  return { name: '', phone: '', region: ['', '', ''], detail: '', remark: '' }
}

onLoad(loadAddresses)

async function loadAddresses() {
  loading.value = true
  try {
    addresses.value = await fetchAddresses()
  } catch {
    uni.showToast({ title: '地址加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = ''
  form.value = emptyForm()
  showForm.value = true
}

function openEdit(item: AddressItem) {
  editingId.value = item.id
  form.value = { ...item, region: [...item.region] }
  showForm.value = true
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

function validate() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请填写收件人姓名', icon: 'none' })
    return false
  }
  if (!/^1\d{10}$/.test(form.value.phone)) {
    uni.showToast({ title: '请填写正确的电话号码', icon: 'none' })
    return false
  }
  if (form.value.region.some((item) => !item)) {
    uni.showToast({ title: '请选择完整的省市区', icon: 'none' })
    return false
  }
  if (!form.value.detail.trim()) {
    uni.showToast({ title: '请填写详细地址', icon: 'none' })
    return false
  }
  return true
}

async function save() {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    const input = { ...form.value, name: form.value.name.trim(), detail: form.value.detail.trim(), remark: form.value.remark.trim() }
    addresses.value = editingId.value ? await updateAddress(editingId.value, input) : await createAddress(input)
    showForm.value = false
    uni.showToast({ title: editingId.value ? '地址已修改' : '地址已保存', icon: 'success' })
  } catch {
    uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function remove(item: AddressItem) {
  uni.showModal({
    title: '删除收货地址',
    content: `确定删除${item.name}的收货地址吗？`,
    success: async (result) => {
      if (!result.confirm) return
      addresses.value = await deleteAddress(item.id)
      uni.showToast({ title: '地址已删除', icon: 'none' })
    }
  })
}

function goBack() {
  // #ifdef H5
  if (window.history.state?.back) window.history.back()
  else window.location.assign(`${window.location.pathname}#/pages/profile/index`)
  // #endif
  // #ifndef H5
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.redirectTo({ url: '/pages/profile/index' })
  // #endif
}
</script>

<template>
  <view class="address-page">
    <view class="topbar"><view class="back" role="button" aria-label="返回" @tap="goBack"><view class="back-arrow" /></view><text>我的地址</text><text class="topbar-label">DAY+ / ADDRESS</text></view>

    <template v-if="!showForm">
      <view class="heading"><text class="eyebrow">DAY+ / DELIVERY</text><text class="title">收货地址</text><text class="subtitle">管理你的配送信息，让每一次购买都更从容。</text></view>
      <view v-if="loading" class="status">正在加载地址…</view>
      <template v-else>
        <view v-if="addresses.length" class="address-list">
          <view v-for="item in addresses" :key="item.id" class="address-card">
            <view class="address-card-head"><view><text class="address-name">{{ item.name }}</text><text class="address-phone">{{ item.phone }}</text></view><text class="address-index">{{ String(addresses.indexOf(item) + 1).padStart(2, '0') }}</text></view>
            <text class="address-region">{{ item.region.join(' · ') }}</text>
            <text class="address-detail">{{ item.detail }}</text>
            <text v-if="item.remark" class="address-remark">备注：{{ item.remark }}</text>
            <view class="address-actions"><text @tap="openEdit(item)">编辑</text><text @tap="remove(item)">删除</text></view>
          </view>
        </view>
        <view v-else class="status"><text>还没有保存收货地址</text><text class="status-note">添加地址后，下单时可以更快完成配送。</text></view>
        <button class="add-button" @tap="openCreate">＋　新增收货地址</button>
      </template>
    </template>

    <template v-else>
      <view class="heading form-heading"><text class="eyebrow">DAY+ / {{ editingId ? 'EDIT ADDRESS' : 'NEW ADDRESS' }}</text><text class="title">{{ editingId ? '修改地址' : '新增地址' }}</text></view>
      <view class="form-card">
        <label class="field"><text>收件人 <small>*</small></text><input v-model="form.name" placeholder="请输入姓名" maxlength="20" /></label>
        <label class="field"><text>电话号码 <small>*</small></text><input v-model="form.phone" type="number" maxlength="11" placeholder="请输入手机号码" /></label>
        <view class="field region-field"><text>所在地区 <small>*</small></text><RegionPicker v-model="form.region" /></view>
        <label class="field textarea-field"><text>详细地址 <small>*</small></text><textarea v-model="form.detail" placeholder="请输入街道、门牌号等详细信息" maxlength="100" /></label>
        <label class="field textarea-field"><text>备注</text><textarea v-model="form.remark" placeholder="选填，例如工作日送达" maxlength="100" /></label>
      </view>
      <view class="form-note">省、市、区和详细地址均为必填项，备注可以不填写。</view>
      <view class="form-actions"><button class="cancel-button" @tap="closeForm">取消</button><button class="save-button" :disabled="saving" @tap="save">{{ saving ? '保存中…' : '保存地址' }}</button></view>
    </template>
    <view class="footer"><image class="footer-brand" src="/static/dayplus-logo.png" mode="aspectFit" /><text>日常之中，自有风格。</text></view>
    <FloatingCart />
  </view>
</template>

<style scoped>
.address-page { min-height: 100vh; max-width: 540px; margin: 0 auto; padding-bottom: 60rpx; background: #f8f7f4; color: #171716; }.topbar { position: relative; height: calc(108rpx + var(--status-bar-height, 0px)); padding-top: var(--status-bar-height, 0px); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #dedcd7; font-size: 27rpx; letter-spacing: 4rpx; }.back { position: absolute; left: 24rpx; bottom: 18rpx; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; }.back-arrow { width: 19rpx; height: 19rpx; border-left: 1px solid #171716; border-bottom: 1px solid #171716; transform: rotate(45deg); }.topbar-label { position: absolute; right: 30rpx; color: #99958e; font-size: 14rpx; letter-spacing: 1rpx; }.heading { padding: 52rpx 36rpx 32rpx; }.eyebrow { color: #8b8883; font-size: 17rpx; letter-spacing: 3rpx; }.title { display: block; margin-top: 14rpx; font-size: 38rpx; font-weight: 300; letter-spacing: 3rpx; }.subtitle { display: block; margin-top: 18rpx; color: #8b8883; font-size: 18rpx; line-height: 1.7; }.address-list { padding: 0 30rpx; display: flex; flex-direction: column; gap: 18rpx; }.address-card { padding: 28rpx 26rpx 22rpx; background: #fdfcf9; border: 1px solid #dedcd7; }.address-card-head { display: flex; justify-content: space-between; align-items: flex-start; }.address-name { font-size: 25rpx; }.address-phone { margin-left: 22rpx; color: #77736c; font-size: 18rpx; }.address-index { color: #a09b93; font-size: 16rpx; letter-spacing: 2rpx; }.address-region { display: block; margin-top: 23rpx; color: #77736c; font-size: 18rpx; }.address-detail { display: block; margin-top: 9rpx; font-size: 21rpx; line-height: 1.6; }.address-remark { display: block; margin-top: 10rpx; color: #969189; font-size: 17rpx; }.address-actions { margin-top: 25rpx; padding-top: 19rpx; display: flex; justify-content: flex-end; gap: 30rpx; border-top: 1px solid #e5e2dd; color: #77736c; font-size: 18rpx; }.add-button { height: 82rpx; margin: 32rpx 30rpx 0; border: 1px solid #171716; border-radius: 0; background: transparent; color: #171716; font-size: 22rpx; letter-spacing: 1rpx; }.add-button::after, .save-button::after, .cancel-button::after { border: 0; }.status { min-height: 300rpx; padding: 30rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18rpx; color: #8b8883; font-size: 21rpx; text-align: center; }.status-note { color: #aaa59d; font-size: 17rpx; }.form-heading { padding-bottom: 27rpx; }.form-card { margin: 0 30rpx; padding: 0 24rpx; background: #fdfcf9; border: 1px solid #dedcd7; }.field { min-height: 98rpx; display: flex; align-items: center; gap: 20rpx; border-bottom: 1px solid #e5e2dd; font-size: 20rpx; }.field:last-child { border-bottom: 0; }.field > text { flex: 0 0 140rpx; }.field small { color: #8d6255; }.field input { min-width: 0; flex: 1; font-size: 19rpx; }.region-field { display: block; padding: 24rpx 0 18rpx; }.region-field > text { display: block; margin-bottom: 15rpx; }.textarea-field { align-items: flex-start; padding: 18rpx 0; }.textarea-field > text { padding-top: 4rpx; }.textarea-field textarea { flex: 1; height: 58rpx; min-height: 58rpx; font-size: 19rpx; line-height: 1.5; }.textarea-field:last-child textarea { height: 48rpx; min-height: 48rpx; }.form-note { margin: 20rpx 36rpx 0; color: #969189; font-size: 17rpx; line-height: 1.6; }.form-actions { display: flex; gap: 14rpx; margin: 38rpx 30rpx 0; }.form-actions button { height: 80rpx; margin: 0; padding: 0; border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 21rpx; line-height: 1; }.cancel-button { flex: 0 0 30%; border: 1px solid #171716; background: transparent; }.save-button { flex: 1; background: #171716; color: #fff; }.save-button[disabled] { background: #bcb8b0; }.footer { padding: 72rpx 0 20rpx; display: flex; flex-direction: column; align-items: center; gap: 14rpx; color: #9b968e; font-size: 17rpx; letter-spacing: 2rpx; }.footer-brand { width: 90rpx; height: 30rpx; display: block; flex-shrink: 0; }@media (min-width: 700px) { .address-page { box-shadow: 0 0 50px rgba(0,0,0,.08); } }
</style>
