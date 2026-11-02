import { request } from './request'
import { appointmentCategories, appointmentReminder, appointmentShops, appointmentSlots, stylists } from '../data/appointment'
import type { AppointmentCategory, Stylist } from '../data/appointment'

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled'

export interface AppointmentRecord {
  id: string
  category: string
  categoryName: string
  shop: string
  date: string
  slot: string
  stylist: string
  stylistName: string
  note: string
  status: AppointmentStatus
  createdAt: string
}

const appointmentStorageKey = 'dayplus-appointments'

function readAppointments(): AppointmentRecord[] {
  const stored: unknown = uni.getStorageSync(appointmentStorageKey)
  return Array.isArray(stored) ? stored as AppointmentRecord[] : []
}

function saveAppointments(items: AppointmentRecord[]) {
  uni.setStorageSync(appointmentStorageKey, items)
}

function seedAppointments(): AppointmentRecord[] {
  return [
    { id: 'appointment-demo-1', category: 'styling', categoryName: '时尚搭配服务', shop: '香奈儿精品店·国贸店', date: '2026-11-08', slot: '14:30', stylist: 's1', stylistName: '林知夏', note: '希望了解秋冬通勤搭配。', status: 'confirmed', createdAt: '2026-10-25T10:00:00.000Z' },
    { id: 'appointment-demo-2', category: 'full-look', categoryName: '全套造型服务', shop: '香奈儿精品店·国贸店', date: '2026-09-18', slot: '11:30', stylist: 's2', stylistName: '陈予安', note: '参加重要场合前的整体造型。', status: 'completed', createdAt: '2026-09-01T10:00:00.000Z' },
    { id: 'appointment-demo-3', category: 'salon', categoryName: '沙龙活动', shop: '香奈儿精品店·国贸店', date: '2026-08-12', slot: '16:00', stylist: 's3', stylistName: '许清禾', note: '', status: 'cancelled', createdAt: '2026-08-01T10:00:00.000Z' }
  ]
}

function getCategoryName(id: string) {
  return appointmentCategories.find((item) => item.id === id)?.name ?? id
}

function getStylistName(id: string) {
  return stylists.find((item) => item.id === id)?.name ?? id
}

export function fetchAppointmentCategories() {
  return request<AppointmentCategory[]>('/appointments/categories', () => appointmentCategories)
}

export function fetchAppointmentShops() {
  return request<string[]>('/appointments/shops', () => appointmentShops)
}

export function fetchAppointmentSlots() {
  return request<string[]>('/appointments/slots', () => appointmentSlots)
}

export function fetchStylists(gender: '全部' | '男' | '女') {
  return request<Stylist[]>(`/appointments/stylists?gender=${gender}`, () =>
    gender === '全部' ? stylists : stylists.filter((stylist) => stylist.gender === gender)
  )
}

export function fetchAppointmentReminder() {
  return request<typeof appointmentReminder>('/appointments/reminder', () => appointmentReminder)
}

export function submitAppointment(data: Record<string, unknown>) {
  return request<{ success: boolean; appointment: AppointmentRecord }>('/appointments', () => {
    const record: AppointmentRecord = {
      id: `appointment-${Date.now()}`,
      category: String(data.category ?? ''),
      categoryName: getCategoryName(String(data.category ?? '')),
      shop: String(data.shop ?? ''),
      date: String(data.date ?? ''),
      slot: String(data.slot ?? ''),
      stylist: String(data.stylist ?? ''),
      stylistName: getStylistName(String(data.stylist ?? '')),
      note: String(data.note ?? ''),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }
    const items = readAppointments()
    saveAppointments([record, ...items])
    return { success: true, appointment: record }
  }, { method: 'POST', data })
}

export function fetchAppointments() {
  return request<AppointmentRecord[]>('/appointments/mine', () => {
    const items = readAppointments()
    if (items.length) return items
    const seeded = seedAppointments()
    saveAppointments(seeded)
    return seeded
  })
}

export function cancelAppointment(id: string) {
  return request<{ success: boolean }>('/appointments/cancel', () => {
    const items = readAppointments()
    saveAppointments(items.map((item) => item.id === id && item.status === 'confirmed' ? { ...item, status: 'cancelled' } : item))
    return { success: true }
  }, { method: 'POST', data: { id } })
}
