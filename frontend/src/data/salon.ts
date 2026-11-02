export interface Salon {
  id: string
  title: string
  subtitle: string
  date: string
  startTime: string
  endTime: string
  location: string
  host: string
  cover: string
  fallbackCover: string
  access: 'public' | 'members'
  price: number
  capacity: number
  reserved: number
  introduction: string[]
  agenda: { time: string; title: string }[]
}

const cover = (prompt: string) => `https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`
const now = new Date()
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export const salons: Salon[] = [
  {
    id: `salon-${month}-01`, title: '衣橱里的秋冬叙事', subtitle: '从材质与色彩，找到属于你的风格',
    date: `${month}-21`, startTime: '14:00', endTime: '16:00', location: 'DAY+ 北京国贸店 · 沙龙空间', host: '林知夏',
    cover: cover('Editorial photograph of an intimate autumn winter fashion styling salon, cashmere coats on a minimal clothing rack, warm beige interior, natural window light, elegant quiet luxury boutique, realistic photography, no text'),
    fallbackCover: '/static/collection.jpg',
    access: 'public', price: 198, capacity: 20, reserved: 12,
    introduction: ['一场关于秋冬衣橱的轻松对谈。从羊毛、针织与丝绸的质感出发，探索适合自己的色彩和轮廓，让每一件单品在日常中拥有更多可能。', '由 DAY+ 造型顾问带来搭配演示与衣橱建议，在小范围交流中分享穿着经验。欢迎带上你想重新搭配的单品，一起寻找新的灵感。'],
    agenda: [{ time: '14:00', title: '签到与欢迎茶饮' }, { time: '14:15', title: '秋冬材质与色彩分享' }, { time: '15:00', title: '造型演示与个人搭配交流' }, { time: '15:45', title: '自由交流与合影' }]
  },
  {
    id: `salon-${month}-02`, title: '私享时光 · 风格茶叙', subtitle: '银卡及以上 会员专属沙龙',
    date: `${month}-28`, startTime: '15:00', endTime: '17:00', location: 'DAY+ 北京国贸店 · 会员会客厅', host: '陈予安',
    cover: cover('Realistic editorial photograph of a private fashion salon tea gathering, ceramic cups on a travertine table, cream linen chairs, curated silk scarves, warm daylight, sophisticated minimalist beige boutique interior, no text'),
    fallbackCover: '/static/appointment.jpg',
    access: 'members', price: 0, capacity: 12, reserved: 6,
    introduction: ['为 银卡及以上 会员准备的一次风格相聚。在茶香与对话中，走近新一季的设计灵感，发现更贴近日常的穿着表达。', '专属顾问将分享场合着装与配饰搭配建议，并提供现场交流。本场免费，仅限 银卡及以上 会员本人预约参与。'],
    agenda: [{ time: '15:00', title: '会员签到与茶歇' }, { time: '15:20', title: '新季灵感与配饰分享' }, { time: '16:00', title: '专属造型交流' }]
  }
]
