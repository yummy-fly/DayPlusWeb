import { request } from './request'
import { activityDetails } from '../data/activity'
import type { ActivityDetail, ActivitySummary } from '../data/activity'

export function fetchActivities(month: string) {
  return request<ActivitySummary[]>('/activities', () => activityDetails
    .filter((activity) => activity.date.startsWith(`${month}-`))
    .map(({ content, ...activity }) => activity), { data: { month } })
}

export function fetchActivityDetail(id: string) {
  return request<ActivityDetail | null>('/activities/detail', () =>
    activityDetails.find((activity) => activity.id === id) ?? null, { data: { id } })
}
