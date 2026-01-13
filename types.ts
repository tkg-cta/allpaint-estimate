export enum VehicleSize {
 LIGHT = 'light',     // 軽自動車
 REGULAR = 'regular', // 普通車 (Compact, Sedan)
 LARGE = 'large',     // 大型/外車 (SUV, Minivan, Van)
}

export interface VehicleType {
 id: string;
 name: string;
 category: VehicleSize;
 image: string;
 prices: {
  solid: number;
  metallic: number;
  pearl: number;
 };
}

export interface PaintType {
 id: 'solid' | 'metallic' | 'pearl';
 name: string;
 description: string;
 image: string;
}

export enum PricingType {
 FIXED = 'fixed',
 VARIES_BY_SIZE = 'varies_by_size',
 PER_UNIT = 'per_unit',
}

export interface OptionItem {
 id: string;
 name: string;
 description?: string;
 detailDescription?: string; // For modal content
 pricingType: PricingType;
 price: number | { [key in VehicleSize]: number };
 unitLabel?: string; // e.g., "1パネル", "1か所"
 category: 'prep' | 'parts' | 'coating' | 'special';
 image: string; // Added image property
}

export interface SelectedOptions {
 [key: string]: number | boolean; // count or boolean
}