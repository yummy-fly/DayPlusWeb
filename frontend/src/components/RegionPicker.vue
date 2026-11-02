<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { regionData, type RegionNode } from '../data/regions'

const props = withDefaults(defineProps<{ modelValue: string[] }>(), {
  modelValue: () => ['', '', '']
})
const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>()

const visible = ref(false)
const activeIndex = ref(0)
const selected = ref<string[]>(['', '', ''])

const provinceList = regionData
const cityList = computed(() => regionData.find((item) => item.name === selected.value[0])?.children ?? [])
const districtList = computed(() => cityList.value.find((item) => item.name === selected.value[1])?.children ?? [])
const currentList = computed(() => activeIndex.value === 0 ? provinceList : activeIndex.value === 1 ? cityList.value : districtList.value)
const displayText = computed(() => selected.value.filter(Boolean).join(' '))

watch(() => props.modelValue, (value) => {
  selected.value = [...value]
}, { immediate: true, deep: true })

function open() {
  selected.value = [...props.modelValue]
  activeIndex.value = selected.value[0] ? selected.value[1] ? 2 : 1 : 0
  visible.value = true
}

function choose(item: RegionNode) {
  selected.value[activeIndex.value] = item.name
  if (activeIndex.value === 0) {
    selected.value[1] = ''
    selected.value[2] = ''
    activeIndex.value = 1
  } else if (activeIndex.value === 1) {
    selected.value[2] = ''
    activeIndex.value = 2
  } else {
    emit('update:modelValue', [...selected.value])
    visible.value = false
  }
}

function confirm() {
  if (selected.value.every(Boolean)) {
    emit('update:modelValue', [...selected.value])
    visible.value = false
  }
}

function close() {
  visible.value = false
}
</script>

<template>
  <view>
    <view class="region-trigger" @tap="open">
      <text :class="{ placeholder: !displayText }">{{ displayText || '请选择省 / 市 / 区' }}</text>
      <text>›</text>
    </view>
    <view v-if="visible" class="region-mask" @tap="close">
      <view class="region-sheet" @tap.stop>
        <view class="region-header"><text>选择所在地区</text><text class="region-close" @tap="close">×</text></view>
        <view class="region-tabs">
          <text v-for="(label, index) in selected" :key="index" :class="{ active: activeIndex === index, chosen: label }" @tap="activeIndex = index">{{ label || ['省份', '城市', '区县'][index] }}</text>
        </view>
        <scroll-view scroll-y class="region-options">
          <view v-for="item in currentList" :key="item.name" class="region-option" :class="{ selected: selected[activeIndex] === item.name }" @tap="choose(item)">
            <text>{{ item.name }}</text><text v-if="selected[activeIndex] === item.name">✓</text>
          </view>
        </scroll-view>
        <button class="region-confirm" :disabled="!selected.every(Boolean)" @tap="confirm">确定</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.region-trigger { min-height: 58rpx; padding: 0 16rpx; display: flex; align-items: center; justify-content: space-between; border: 1px solid #d5d2cc; font-size: 18rpx; }.placeholder { color: #aaa59d; }.region-mask { position: fixed; z-index: 20; inset: 0; display: flex; align-items: flex-end; background: rgba(23, 23, 22, .28); }.region-sheet { width: 100%; max-width: 540px; max-height: 76vh; margin: 0 auto; padding: 26rpx 30rpx 30rpx; box-sizing: border-box; background: #f8f7f4; }.region-header { display: flex; justify-content: space-between; align-items: center; font-size: 24rpx; }.region-close { color: #77736c; font-size: 38rpx; font-weight: 200; }.region-tabs { display: flex; gap: 34rpx; margin-top: 25rpx; border-bottom: 1px solid #dedcd7; }.region-tabs text { padding-bottom: 16rpx; color: #aaa59d; font-size: 19rpx; }.region-tabs .active { color: #171716; border-bottom: 2px solid #171716; }.region-tabs .chosen { color: #77736c; }.region-options { height: 430rpx; padding-top: 8rpx; }.region-option { min-height: 76rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e2dd; font-size: 20rpx; }.region-option.selected { color: #171716; font-weight: 500; }.region-confirm { height: 76rpx; margin-top: 20rpx; border-radius: 0; background: #171716; color: #fff; font-size: 20rpx; }.region-confirm[disabled] { background: #bcb8b0; }.region-confirm::after { border: 0; }
</style>
