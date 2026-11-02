export type ActivityType = '店内活动' | '沙龙' | '主题活动'

export interface ActivitySummary {
  id: string
  date: string
  type: ActivityType
  name: string
  startTime: string
  endTime: string
}

export type ActivityContent = { type: 'text'; text: string } | { type: 'image'; src: string; caption: string }

export interface ActivityDetail extends ActivitySummary {
  content: ActivityContent[]
}

const image = (prompt: string) => `https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`
const storeImage = image('Editorial interior photography of an intimate minimalist fashion boutique, warm ivory walls, natural oak clothing racks, curated neutral linen garments, afternoon sunlight, realistic photography, no text, no logos')
const salonImage = image('Editorial lifestyle photography of a small fashion styling salon in an elegant beige boutique, women discussing natural fabric swatches around an oak table, soft daylight, candid realistic photography, no text, no logos')
const themeImage = image('Editorial still life photography of a curated seasonal wardrobe, wool coat and cream knitwear with brown leather accessories on a wooden table, warm minimalist boutique, natural sunlight, realistic photography, no text, no logos')
const templates: Array<Omit<ActivityDetail, 'id' | 'date'> & { day: number }> = [
  { day: 5, type: '店内活动', name: '新季衣橱 · 到店品鉴', startTime: '10:00', endTime: '12:00', content: [
    { type: 'image', src: storeImage, caption: '在熟悉的空间，遇见新季灵感。' },
    { type: 'text', text: '邀请你来到 DAY+，一起慢慢发现新一季的日常衣橱。从面料的触感到自然舒展的廓形，在轻松的试穿中，找到属于自己的穿衣节奏。' },
    { type: 'text', text: '本次店内品鉴将围绕通勤、周末与日常相聚三个场景展开。你可以近距离感受精选单品，也可以与店内顾问交流搭配想法。活动在 DAY+ 门店举行，欢迎按活动时间到店体验。' }
  ] },
  { day: 12, type: '沙龙', name: '风格对话 · 日常穿搭沙龙', startTime: '14:00', endTime: '16:00', content: [
    { type: 'image', src: salonImage, caption: '围坐、分享，聊聊日常与风格。' },
    { type: 'text', text: '风格来自日常的选择。这一次，我们在 DAY+ 门店围坐交流，从色彩、材质与比例出发，分享让穿搭更自在的小灵感。' },
    { type: 'image', src: themeImage, caption: '用熟悉的单品，搭配新的可能。' },
    { type: 'text', text: '沙龙包含搭配分享与自由交流。欢迎带着你对衣橱的疑问，在一杯茶的时间里，与我们一起探索更适合自己的表达。' }
  ] },
  { day: 12, type: '店内活动', name: '面料探索 · 触感体验', startTime: '16:30', endTime: '18:00', content: [
    { type: 'image', src: themeImage, caption: '从一块面料开始，认识衣物的细节。' },
    { type: 'text', text: '走近天然面料，感受不同织法与材质的细微差别。我们将在 DAY+ 门店分享面料的特性、日常护理方式，以及不同季节的搭配建议。' },
    { type: 'text', text: '现场可自由触摸面料样本、试穿精选款式，与店内顾问交流。让每一件衣服都成为更长久的日常陪伴。' }
  ] },
  { day: 21, type: '主题活动', name: '衣橱漫游 · 季节灵感展', startTime: '13:00', endTime: '17:00', content: [
    { type: 'image', src: themeImage, caption: '以季节为线索，重新发现日常。' },
    { type: 'text', text: '以自然色彩和舒适质感为线索，DAY+ 将日常衣物与生活物件组合成一场小型灵感展。欢迎来到门店，慢慢浏览，寻找适合自己的季节灵感。' },
    { type: 'image', src: storeImage, caption: '把灵感，带回自己的生活。' },
    { type: 'text', text: '活动时间内可自由到店观展。现场将展示主题搭配，并提供单品试穿与搭配交流，让灵感落在每一个真实的生活场景里。' }
  ] },
  { day: 28, type: '沙龙', name: '自在生活 · 衣橱整理分享', startTime: '14:30', endTime: '16:00', content: [
    { type: 'image', src: salonImage, caption: '留下一份空间，给真正喜欢的衣物。' },
    { type: 'text', text: '一起聊聊如何整理衣橱、照顾常穿的衣物，以及如何通过简单的组合，让已有单品焕发新的活力。' },
    { type: 'text', text: '分享将在 DAY+ 门店进行，包含衣橱整理方法、换季收纳建议及自由问答。愿每一次打开衣橱，都能轻松找到今天的自己。' }
  ] }
]

// 以当前月份为中心准备三个月的演示活动，日期固定，便于切月体验。
const today = new Date()
export const activityDetails: ActivityDetail[] = [-1, 0, 1].flatMap((offset) => {
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  return templates.map(({ day, ...activity }, index) => ({
    ...activity,
    id: `${prefix}-${index + 1}`,
    date: `${prefix}-${String(day).padStart(2, '0')}`
  }))
})
