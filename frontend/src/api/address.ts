import { request } from './request'
import { mockAddresses } from '../data/address'
import type { AddressItem } from '../data/address'

const storageKey = 'dayplus-addresses'

function readAddresses(): AddressItem[] {
  const stored: unknown = uni.getStorageSync(storageKey)
  return Array.isArray(stored) ? stored as AddressItem[] : mockAddresses.map((item) => ({ ...item, region: [...item.region] }))
}

function saveAddresses(items: AddressItem[]) {
  uni.setStorageSync(storageKey, items)
  return items
}

export function fetchAddresses() {
  return request<AddressItem[]>('/user/addresses', () => readAddresses())
}

export function createAddress(input: Omit<AddressItem, 'id'>) {
  return request<AddressItem[]>('/user/addresses', () => {
    const items = [...readAddresses(), { ...input, id: `address-${Date.now()}` }]
    return saveAddresses(items)
  }, { method: 'POST', data: input })
}

export function updateAddress(id: string, input: Omit<AddressItem, 'id'>) {
  return request<AddressItem[]>('/user/addresses/update', () => {
    const items = readAddresses().map((item) => item.id === id ? { ...input, id } : item)
    return saveAddresses(items)
  }, { method: 'PUT', data: { id, ...input } })
}

export function deleteAddress(id: string) {
  return request<AddressItem[]>('/user/addresses/delete', () => {
    const items = readAddresses().filter((item) => item.id !== id)
    return saveAddresses(items)
  }, { method: 'DELETE', data: { id } })
}
