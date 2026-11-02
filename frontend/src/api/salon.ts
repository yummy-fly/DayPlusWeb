import { request } from './request'
import { salons } from '../data/salon'
import type { Salon } from '../data/salon'
import { isLoggedIn } from './home'
import { fetchMemberProfile } from './profile'
import { memberProfile } from '../data/profile'
import { readAppointments, saveAppointments } from './appointment'
import type { AppointmentRecord } from './appointment'

export type SalonPayment = 'wechat' | 'balance' | 'free'

function withReservations(salon: Salon): Salon {
  return { ...salon, reserved: salon.reserved + readAppointments().filter((item) => item.salonId === salon.id && item.status !== 'cancelled').length }
}

export function fetchCurrentSalons() {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return request<Salon[]>(`/salons?month=${month}`, () => salons.filter((item) => item.date.startsWith(month)).map(withReservations).sort((a, b) => a.date.localeCompare(b.date)))
}

export function fetchSalonDetail(id: string) {
  return request<Salon | null>(`/salons/${encodeURIComponent(id)}`, () => {
    const salon = salons.find((item) => item.id === id)
    return salon ? withReservations(salon) : null
  })
}

export function fetchSalonBooking(id: string) {
  return request<AppointmentRecord | null>(`/salons/${encodeURIComponent(id)}/booking`, () => {
    if (!isLoggedIn()) return null
    return readAppointments().find((item) => item.salonId === id && item.status !== 'cancelled') ?? null
  })
}

export async function bookSalon(id: string, paymentMethod: SalonPayment) {
  const member = await fetchMemberProfile()
  return request<AppointmentRecord>('/salons/book', () => {
    if (!isLoggedIn()) throw new Error('请先登录后报名')
    const salon = salons.find((item) => item.id === id)
    if (!salon) throw new Error('活动不存在')
    const records = readAppointments()
    const existing = records.find((item) => item.salonId === id && item.status !== 'cancelled')
    if (existing) return existing
    const isMember = ['银卡', '金卡', '白金卡'].includes(member.level)
    if (salon.access === 'members' && !isMember) throw new Error('本场仅限 银卡及以上会员报名')
    if (new Date(`${salon.date}T${salon.startTime}:00`).getTime() <= Date.now()) throw new Error('本场报名已结束')
    if (withReservations(salon).reserved >= salon.capacity) throw new Error('本场已满员')
    if (salon.price > 0 && paymentMethod !== 'wechat' && paymentMethod !== 'balance') throw new Error('请先完成支付')
    const previousBalance = uni.getStorageSync('dayplus-member-balance')
    const balance = typeof previousBalance === 'number' ? previousBalance : memberProfile.balance
    if (salon.price > 0 && paymentMethod === 'balance') {
      if (!isMember) throw new Error('余额支付仅限 银卡及以上会员')
      if (balance < salon.price) throw new Error('会员卡余额不足，请充值或选择微信支付')
    }
    const record: AppointmentRecord = {
      id: `salon-booking-${Date.now()}`, category: 'salon', categoryName: salon.title,
      salonId: salon.id, shop: salon.location, date: salon.date, slot: `${salon.startTime} — ${salon.endTime}`,
      stylist: '', stylistName: salon.host, note: '请提前 10 分钟到场，向工作人员出示预约记录。',
      status: 'confirmed', createdAt: new Date().toISOString(), amount: salon.price,
      paymentMethod: salon.price > 0 ? paymentMethod : 'free'
    }
    // 模拟接口同步完成扣款和预约写入，失败时恢复原余额。
    try {
      if (salon.price > 0 && paymentMethod === 'balance') uni.setStorageSync('dayplus-member-balance', balance - salon.price)
      saveAppointments([record, ...records])
    } catch (error) {
      if (salon.price > 0 && paymentMethod === 'balance') uni.setStorageSync('dayplus-member-balance', balance)
      throw error
    }
    console.info('[Salon] 报名成功', { salonId: id, paymentMethod: record.paymentMethod })
    return record
  }, { method: 'POST', data: { salonId: id, paymentMethod } })
}
