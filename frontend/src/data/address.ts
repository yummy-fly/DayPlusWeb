export interface AddressItem {
  id: string
  name: string
  phone: string
  region: string[]
  detail: string
  remark: string
}

export const mockAddresses: AddressItem[] = [
  {
    id: 'address-demo-01',
    name: 'DAY+ 顾客',
    phone: '138****2680',
    region: ['上海市', '上海市', '静安区'],
    detail: '南京西路 1266 号 DAY+ 门店',
    remark: '工作日送达'
  }
]
