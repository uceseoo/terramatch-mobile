export const LANDSCAPES = [
  'Greater Rift Valley',
  'Lake Kivu & Rusizi',
  'Ghana Cocoa Belt',
] as const;

export type Landscape = (typeof LANDSCAPES)[number];

export const LANDSCAPE_FILTERS = ['all', ...LANDSCAPES] as const;

export type LandscapeFilter = (typeof LANDSCAPE_FILTERS)[number];
