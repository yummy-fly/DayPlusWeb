import { USE_MOCK, API_BASE_URL } from '../config'

/** 本地模式下模拟网络延迟（ms） */
const MOCK_DELAY = 200

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
}

/**
 * 统一数据请求入口
 *  - 本地模式（USE_MOCK = true）：返回 src/data 下的模拟数据
 *  - 远程模式（USE_MOCK = false）：请求 API_BASE_URL + path 的真实后端接口
 *
 * @param path        接口路径，如 '/home/slides'
 * @param mockLoader  本地模式下的模拟数据加载函数
 * @param options     远程模式的请求配置
 */
export function request<T>(
  path: string,
  mockLoader: () => T | Promise<T>,
  options: RequestOptions = {}
): Promise<T> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLoader() as T), MOCK_DELAY)
    })
  }
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE_URL + path,
      method: options.method ?? 'GET',
      data: options.data,
      header: { 'content-type': 'application/json' },
      success: (res) => resolve(res.data as T),
      fail: (err) => reject(new Error(err.errMsg ?? `请求失败: ${path}`))
    })
  })
}
