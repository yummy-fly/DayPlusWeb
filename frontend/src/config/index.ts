/**
 * 全局配置（独立配置文件）
 */

/**
 * 数据源开关
 *  - true  → 本地模式：使用 src/data 下的模拟数据，无需后端
 *  - false → 远程模式：调用 API_BASE_URL 指向的真实后端接口
 */
export const USE_MOCK = true

/** 真实后端 API 地址（远程模式时生效） */
export const API_BASE_URL = 'http://localhost:8080/api'
