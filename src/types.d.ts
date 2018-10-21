export interface InfluxWelPoint extends Array<Point> { 0: Point }

export interface Point {
  measurement?: string
  tags: WelTags
  fields: WelMeansurements
}

export interface WelTags {
  [ wel: string ]: string
}

export interface WelMeansurements {
  airReturn: number
  airSupply: number
  basementTemp: number
  bedRoomTemp: number
  hotWaterGeneratorIn: number
  hotWaterGeneratorOut: number
  livingRoomTemp: number
  outsideTemp: number
  wattNodeGSHP: number
  wattNodeOther: number
  wattNodeTotal: number
}
