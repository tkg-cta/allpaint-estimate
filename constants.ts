import { VehicleType, PaintType, OptionItem, VehicleSize, PricingType } from './types';

// Step 1-1: Vehicle Types
export const VEHICLES: VehicleType[] = [
 {
  id: 'kei',
  name: '軽自動車',
  category: VehicleSize.LIGHT,
  image: 'https://picsum.photos/id/111/300/200',
  prices: {
   solid: 100000,
   metallic: 120000,
   pearl: 140000,
  },
 },
 {
  id: 'compact',
  name: 'コンパクトカー',
  category: VehicleSize.REGULAR,
  image: 'https://picsum.photos/id/133/300/200',
  prices: {
   solid: 120000,
   metallic: 140000,
   pearl: 160000,
  },
 },
 {
  id: 'sedan',
  name: '中型セダン',
  category: VehicleSize.REGULAR,
  image: 'https://picsum.photos/id/183/300/200',
  prices: {
   solid: 140000,
   metallic: 160000,
   pearl: 180000,
  },
 },
 {
  id: 'suv',
  name: 'SUV',
  category: VehicleSize.LARGE,
  image: 'https://picsum.photos/id/296/300/200',
  prices: {
   solid: 160000,
   metallic: 180000,
   pearl: 200000,
  },
 },
 {
  id: 'minivan',
  name: 'ミニバン',
  category: VehicleSize.LARGE,
  image: 'https://picsum.photos/id/196/300/200',
  prices: {
   solid: 180000,
   metallic: 200000,
   pearl: 220000,
  },
 },
 {
  id: 'onebox',
  name: 'ワンボックス',
  category: VehicleSize.LARGE,
  image: 'https://picsum.photos/id/655/300/200',
  prices: {
   solid: 200000,
   metallic: 220000,
   pearl: 240000,
  },
 },
];

// Step 1-2: Paint Menu
export const PAINTS: PaintType[] = [
 {
  id: 'solid',
  name: 'ソリッド (単色)',
  description: 'シンプルで力強い発色。クラシックな印象に。',
  image: 'https://picsum.photos/seed/blue/400/300',
 },
 {
  id: 'metallic',
  name: 'メタリック',
  description: '金属片を含んだ塗料で、キラキラとした輝きを放ちます。',
  image: 'https://picsum.photos/seed/silver/400/300',
 },
 {
  id: 'pearl',
  name: 'パール',
  description: '真珠のような深みのある光沢と高級感を演出します。',
  image: 'https://picsum.photos/seed/pearl/400/300',
 },
];

// Step 2 & 3: Options
export const OPTIONS: OptionItem[] = [
 // --- Prep & Repair ---
 {
  id: 'clear_peel',
  name: 'クリアー剥離',
  description: '劣化したクリア層を剥がして下地を整えます',
  category: 'prep',
  pricingType: PricingType.PER_UNIT,
  price: 10000,
  unitLabel: 'パネル',
  image: 'https://picsum.photos/seed/peel/150/150',
 },
 {
  id: 'scratch_repair',
  name: '擦り傷補修',
  description: '車体の擦り傷を補修します',
  category: 'prep',
  pricingType: PricingType.PER_UNIT,
  price: 10000,
  unitLabel: 'パネル',
  image: 'https://picsum.photos/seed/scratch/150/150',
 },
 {
  id: 'dent_repair',
  name: '凹み補修',
  description: '車体の凹みを補修します',
  category: 'prep',
  pricingType: PricingType.PER_UNIT,
  price: 10000,
  unitLabel: 'パネル',
  image: 'https://picsum.photos/seed/dent/150/150',
 },
 {
  id: 'wrapping_peel',
  name: 'ラッピング剥離',
  description: '既存のラッピングを全て剥がします',
  category: 'prep',
  pricingType: PricingType.FIXED,
  price: 50000,
  image: 'https://picsum.photos/seed/wrap/150/150',
 },

 // --- Parts Removal ---
 {
  id: 'parts_removal_set',
  name: '外廻り 脱着セット',
  description: 'バンパー、ライト、ドアノブ等の脱着を行い綺麗に仕上げます。',
  category: 'parts',
  pricingType: PricingType.VARIES_BY_SIZE,
  price: {
   [VehicleSize.LIGHT]: 25000,
   [VehicleSize.REGULAR]: 35000,
   [VehicleSize.LARGE]: 45000,
  },
  image: 'https://picsum.photos/seed/parts/150/150',
 },
 {
  id: 'parts_removal_aero',
  name: 'エアロ脱着追加',
  description: 'エアロパーツ装着車の場合の追加料金',
  category: 'parts',
  pricingType: PricingType.FIXED,
  price: 20000,
  image: 'https://picsum.photos/seed/aero/150/150',
 },
 {
  id: 'glass_removal',
  name: 'ガラス脱着セット',
  description: 'ガラスを取り外して塗装します（モール交換含む）',
  category: 'parts',
  pricingType: PricingType.FIXED,
  price: 50000,
  image: 'https://picsum.photos/seed/glass/150/150',
 },

 // --- Painting Options ---
 {
  id: 'door_inner',
  name: 'ドア中塗装',
  description: 'ドアを開けた内側部分も塗装します',
  category: 'special',
  pricingType: PricingType.VARIES_BY_SIZE,
  price: {
   [VehicleSize.LIGHT]: 10000,
   [VehicleSize.REGULAR]: 15000,
   [VehicleSize.LARGE]: 15000,
  },
  unitLabel: 'ドア',
  image: 'https://picsum.photos/seed/door/150/150',
 },
 {
  id: 'two_tone',
  name: '2色塗装',
  description: 'ルーフなどを別の色で塗り分ける場合',
  category: 'special',
  pricingType: PricingType.FIXED,
  price: 30000,
  image: 'https://picsum.photos/seed/twotone/150/150',
 },
 {
  id: 'matte',
  name: 'マット塗装 (艶消し)',
  description: 'ワイルドでモダンな艶消し仕上げに変更',
  category: 'special',
  pricingType: PricingType.VARIES_BY_SIZE,
  price: {
   [VehicleSize.LIGHT]: 30000,
   [VehicleSize.REGULAR]: 40000,
   [VehicleSize.LARGE]: 50000,
  },
  image: 'https://picsum.photos/seed/matte/150/150',
 },
 {
  id: 'clear_coat',
  name: '高品位クリアーコート',
  description: '通常より厚みと光沢のあるクリアー層を追加',
  category: 'special',
  pricingType: PricingType.VARIES_BY_SIZE,
  price: {
   [VehicleSize.LIGHT]: 30000,
   [VehicleSize.REGULAR]: 40000,
   [VehicleSize.LARGE]: 50000,
  },
  image: 'https://picsum.photos/seed/clear/150/150',
 },
 {
  id: 'mirror_finish',
  name: '鏡面仕上げ',
  description: '塗装肌を平滑に磨き上げる最高級の仕上げ',
  category: 'special',
  pricingType: PricingType.FIXED,
  price: 50000,
  image: 'https://picsum.photos/seed/mirror/150/150',
 },
 {
  id: 'raptor',
  name: 'ラプター塗装',
  description: '傷に強い高耐久ウレタン塗装（バンパー等）',
  category: 'special',
  pricingType: PricingType.FIXED,
  price: 30000,
  image: 'https://picsum.photos/seed/raptor/150/150',
 },

 // --- Coating & Others ---
 {
  id: 'glass_coating',
  name: 'ガラス全面コーティング',
  description: '塗装後のボディを保護し、輝きを持続させます',
  category: 'coating',
  pricingType: PricingType.FIXED,
  price: 5000,
  image: 'https://picsum.photos/seed/coating/150/150',
 },
 {
  id: 'headlight_clear',
  name: 'ヘッドランプクリアー塗装',
  description: '黄ばみを除去しクリア塗装で保護 (左右)',
  category: 'coating',
  pricingType: PricingType.FIXED,
  price: 10000,
  image: 'https://picsum.photos/seed/lamp/150/150',
 },
 {
  id: 'wheel_paint',
  name: 'ホイール塗装',
  description: 'ホイールの色替え (1本〜)',
  category: 'special',
  pricingType: PricingType.PER_UNIT,
  price: 5000,
  unitLabel: '本',
  image: 'https://picsum.photos/seed/wheel/150/150',
 },
];