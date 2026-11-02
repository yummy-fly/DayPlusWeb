export interface WorkItem {
  image: string
  code: string
  name: string
  favorite?: boolean
}

export type WorkCollections = Record<string, WorkItem[]>

export type LookCategory = '帽子' | '眼镜' | '成衣' | '手袋' | '鞋子' | '配饰'

export interface LookProduct {
  id: string
  category: LookCategory
  image: string
  price: number
  favorite: boolean
  imageStyle?: string
}

export interface LookDetail {
  id: string
  code: string
  name: string
  series: string
  description: string
  images: { src: string; label: string; imageStyle?: string }[]
  products: LookProduct[]
}

export interface ProductDetail {
  id: string
  category: LookCategory
  name: string
  code: string
  description: string
  price: number
  colors: string[]
  colorImages: Record<string, { src: string; label: string; imageStyle?: string }[]>
  sizes: string[]
  images: { src: string; label: string; imageStyle?: string }[]
  favorite: boolean
}

const lookProducts: LookProduct[] = [
  { id: 'shirt-01', category: '成衣', image: '/static/shirt.jpg', price: 1980, favorite: false, imageStyle: '' },
  { id: 'trousers-01', category: '成衣', image: '/static/collection.jpg', imageStyle: 'transform: scale(1.7); transform-origin: 50% 68%;', price: 1680, favorite: false },
  { id: 'coat-01', category: '成衣', image: '/static/coat.jpg', price: 3680, favorite: false, imageStyle: '' },
  { id: 'bag-01', category: '手袋', image: '/static/bag.jpg', price: 2860, favorite: false, imageStyle: '' },
  { id: 'shoes-01', category: '鞋子', image: '/static/collection.jpg', imageStyle: 'transform: scale(3.5); transform-origin: 50% 97%;', price: 1280, favorite: false }
]

// 当前本地素材仅有单一机位，细节图用于演示轮播；多角度实拍可直接替换 images。
const outfitVariants = [
  { image: '/static/collection.jpg', productIds: ['shirt-01', 'trousers-01', 'shoes-01'], description: '柔和的象牙白与流动的丝质线条相映，利落长裤收束廓形，在轻盈与秩序之间找到日常的从容。' },
  { image: '/static/hero.jpg', productIds: ['coat-01', 'shoes-01'], description: '深灰长外套勾勒舒展轮廓，简洁的线条与柔和鞋履相映，在光影之间呈现从容的都市气息。' },
  { image: '/static/collection.jpg', productIds: ['shirt-01', 'trousers-01'], description: '温润色调与舒展线条交织，以轻盈上装呼应利落长裤，让每一次出行都保有松弛与秩序。' },
  { image: '/static/hero.jpg', productIds: ['coat-01', 'bag-01', 'shoes-01'], description: '以简洁成衣铺陈留白，皮革手袋增添质感细节，平衡柔和与力量，留下恰到好处的个人表达。' }
]

export const workCollections: WorkCollections = {
  '2026秋冬系列': [
    { image: '/static/collection.jpg', code: 'LOOK 01', name: '结构与柔软' },
    { image: '/static/hero.jpg', code: 'LOOK 02', name: '光影之间' },
    { image: '/static/appointment.jpg', code: 'LOOK 03', name: '松弛秩序' },
    { image: '/static/bag.jpg', code: 'LOOK 04', name: '细节成章' }
  ],
  '2026秋季系列': [
    { image: '/static/hero.jpg', code: 'LOOK 01', name: '都市的静谧' },
    { image: '/static/collection.jpg', code: 'LOOK 02', name: '柔和廓形' },
    { image: '/static/coat.jpg', code: 'LOOK 03', name: '线条之间' }
  ],
  '2026夏季系列': [
    { image: '/static/appointment.jpg', code: 'LOOK 01', name: '轻盈时刻' },
    { image: '/static/shirt.jpg', code: 'LOOK 02', name: '白昼漫游' },
    { image: '/static/bag.jpg', code: 'LOOK 03', name: '夏日留白' }
  ],
  '2026春季系列': [
    { image: '/static/shirt.jpg', code: 'LOOK 01', name: '春日序章' },
    { image: '/static/collection.jpg', code: 'LOOK 02', name: '新生轮廓' },
    { image: '/static/hero.jpg', code: 'LOOK 03', name: '柔光之下' }
  ],
  成衣: [
    { image: '/static/coat.jpg', code: '01', name: '廓形羊毛外套' },
    { image: '/static/shirt.jpg', code: '02', name: '真丝缎面衬衫' },
    { image: '/static/collection.jpg', code: '03', name: '垂坠针织长裙' },
    { image: '/static/hero.jpg', code: '04', name: '短款立体夹克' }
  ],
  手袋: [
    { image: '/static/bag.jpg', code: '01', name: '线条感皮革手袋' },
    { image: '/static/collection.jpg', code: '02', name: '柔光手提包' },
    { image: '/static/hero.jpg', code: '03', name: '经典链条包' },
    { image: '/static/appointment.jpg', code: '04', name: '旅行随行包' }
  ],
  帽子: [
    { image: '/static/hero.jpg', code: '01', name: '羊毛礼帽' },
    { image: '/static/appointment.jpg', code: '02', name: '软檐渔夫帽' },
    { image: '/static/collection.jpg', code: '03', name: '短檐鸭舌帽' },
    { image: '/static/bag.jpg', code: '04', name: '编织宽檐帽' }
  ],
  眼镜: [
    { image: '/static/shirt.jpg', code: '01', name: '细金属框眼镜' },
    { image: '/static/coat.jpg', code: '02', name: '复古墨镜' },
    { image: '/static/bag.jpg', code: '03', name: '雕塑感镜框' },
    { image: '/static/appointment.jpg', code: '04', name: '琥珀色镜片' }
  ],
  配饰: [
    { image: '/static/appointment.jpg', code: '01', name: '轻盈羊绒围巾' },
    { image: '/static/bag.jpg', code: '02', name: '珍珠耳饰' },
    { image: '/static/shirt.jpg', code: '03', name: '金属胸针' },
    { image: '/static/coat.jpg', code: '04', name: '窄版皮带' }
  ]
}

export const productDetails: Record<string, ProductDetail> = {}

export const lookDetails: Record<string, LookDetail> = {}

function buildColorImages(image: string, imageStyle: string | undefined, colors: string[]) {
  return Object.fromEntries(colors.map((color, colorIndex) => {
    const tone = colorIndex === 1
      ? 'filter: saturate(.75) sepia(.08);'
      : colorIndex === 2
        ? 'filter: grayscale(.35) contrast(1.05);'
        : ''
    return [color, [
      { src: image, label: '正面', imageStyle: `${imageStyle ?? ''}${tone}` },
      { src: image, label: '细节', imageStyle: `${imageStyle ?? ''}transform: scale(1.12); transform-origin: 50% 45%;${tone}` },
      { src: image, label: '搭配', imageStyle: `${imageStyle ?? ''}transform: scale(1.04); transform-origin: 50% 60%;${tone}` }
    ]]
  }))
}

for (const [series, items] of Object.entries(workCollections)) {
  if (!series.endsWith('系列')) continue
  items.forEach((item, index) => {
    const variant = outfitVariants[index % outfitVariants.length]
    const images = [
      { src: variant.image, label: '全身造型' },
      { src: variant.image, label: '上装细节', imageStyle: 'transform: scale(1.65); transform-origin: 50% 28%;' },
      { src: variant.image, label: '廓形细节', imageStyle: 'transform: scale(1.5); transform-origin: 50% 75%;' }
    ]
    item.image = variant.image
    const id = `${series}:${item.code}`
    const products = lookProducts.filter((product) => variant.productIds.includes(product.id)).map((product) => ({ ...product }))
    lookDetails[id] = {
      id, code: item.code, name: item.name, series,
      description: variant.description,
      images,
      products
    }
    products.forEach((product) => {
      if (productDetails[product.id]) return
      productDetails[product.id] = {
        id: product.id,
        category: product.category,
        name: product.id === 'shirt-01' ? '真丝缎面衬衫' : product.id === 'trousers-01' ? '垂坠阔腿长裤' : product.id === 'coat-01' ? '廓形羊毛外套' : product.category === '手袋' ? '线条感皮革手袋' : '简约尖头高跟鞋',
        code: `DAY+ / ${product.id.toUpperCase()}`,
        description: '以克制的线条与舒适的材质完成日常造型，适合与系列中的不同单品自由搭配。',
        price: product.price,
        colors: product.category === '手袋' ? ['深黑', '暖棕'] : ['象牙白', '暖灰', '深黑'],
        sizes: product.category === '手袋' || product.category === '鞋子' ? ['均码'] : ['XS', 'S', 'M', 'L'],
        images: [
          { src: product.image, label: '正面', imageStyle: product.imageStyle },
          { src: product.image, label: '细节', imageStyle: product.imageStyle },
          { src: product.image, label: '搭配', imageStyle: product.imageStyle }
        ],
        colorImages: buildColorImages(
          product.image,
          product.imageStyle,
          product.category === '手袋' ? ['深黑', '暖棕'] : ['象牙白', '暖灰', '深黑']
        ),
        favorite: false
      }
    })
  })
}

const catalogProducts: Record<string, { category: LookCategory; name: string; image: string; price: number }> = {
  'bag-02': { category: '手袋', name: '柔光手提包', image: '/static/collection.jpg', price: 2480 },
  'bag-03': { category: '手袋', name: '经典链条包', image: '/static/hero.jpg', price: 2680 },
  'bag-04': { category: '手袋', name: '旅行随行包', image: '/static/appointment.jpg', price: 3180 },
  'dress-01': { category: '成衣', name: '垂坠针织长裙', image: '/static/collection.jpg', price: 2280 },
  'jacket-01': { category: '成衣', name: '短款立体夹克', image: '/static/hero.jpg', price: 2980 },
  'scarf-01': { category: '配饰', name: '轻盈羊绒围巾', image: '/static/appointment.jpg', price: 980 },
  'hat-01': { category: '帽子', name: '羊毛礼帽', image: '/static/hero.jpg', price: 1280 },
  'hat-02': { category: '帽子', name: '软檐渔夫帽', image: '/static/appointment.jpg', price: 980 },
  'hat-03': { category: '帽子', name: '短檐鸭舌帽', image: '/static/collection.jpg', price: 880 },
  'hat-04': { category: '帽子', name: '编织宽檐帽', image: '/static/bag.jpg', price: 1680 },
  'glasses-01': { category: '眼镜', name: '细金属框眼镜', image: '/static/shirt.jpg', price: 1280 },
  'glasses-02': { category: '眼镜', name: '复古墨镜', image: '/static/coat.jpg', price: 1580 },
  'glasses-03': { category: '眼镜', name: '雕塑感镜框', image: '/static/bag.jpg', price: 1380 },
  'glasses-04': { category: '眼镜', name: '琥珀色镜片', image: '/static/appointment.jpg', price: 1180 },
  'accessory-01': { category: '配饰', name: '轻盈羊绒围巾', image: '/static/appointment.jpg', price: 980 },
  'accessory-02': { category: '配饰', name: '珍珠耳饰', image: '/static/bag.jpg', price: 1280 },
  'accessory-03': { category: '配饰', name: '金属胸针', image: '/static/shirt.jpg', price: 780 },
  'accessory-04': { category: '配饰', name: '窄版皮带', image: '/static/coat.jpg', price: 880 }
}

export const workProductIds: Record<string, string> = {
  廓形羊毛外套: 'coat-01', 真丝缎面衬衫: 'shirt-01', 线条感皮革手袋: 'bag-01',
  垂坠针织长裙: 'dress-01', 短款立体夹克: 'jacket-01', 轻盈羊绒围巾: 'scarf-01',
  羊毛礼帽: 'hat-01', 软檐渔夫帽: 'hat-02', 短檐鸭舌帽: 'hat-03', 编织宽檐帽: 'hat-04',
  柔光手提包: 'bag-02', 经典链条包: 'bag-03', 旅行随行包: 'bag-04',
  细金属框眼镜: 'glasses-01', 复古墨镜: 'glasses-02', 雕塑感镜框: 'glasses-03', 琥珀色镜片: 'glasses-04',
  珍珠耳饰: 'accessory-02', 金属胸针: 'accessory-03', 窄版皮带: 'accessory-04'
}

for (const [id, item] of Object.entries(catalogProducts)) {
  if (productDetails[id]) continue
  const colors = item.category === '手袋' ? ['深黑', '暖棕'] : ['象牙白', '暖灰', '深黑']
  productDetails[id] = {
    id, category: item.category, name: item.name, code: `DAY+ / ${id.toUpperCase()}`,
    description: '以克制的线条与舒适的材质完成日常造型，适合与系列中的不同单品自由搭配。',
    price: item.price, colors, sizes: item.category === '手袋' ? ['均码'] : ['XS', 'S', 'M', 'L'],
    images: buildColorImages(item.image, '', colors)[colors[0]],
    colorImages: buildColorImages(item.image, '', colors), favorite: false
  }
}
