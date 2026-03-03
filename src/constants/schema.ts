export const POLY_FIELDS = {
  poly_name: {
    label: 'Polygon Name',
    type: 'text' as const,
    placeholder: 'e.g. Coset Chebuliot',
    required: true,
  },
  plantstart: {
    label: 'Planting Start Date',
    type: 'date' as const,
    required: true,
  },
  practice: {
    label: 'Restoration Practice',
    type: 'select' as const,
    required: true,
    options: [
      'Tree Planting',
      'Direct Seeding',
      'Assisted Natural Regeneration (ANR)',
    ],
  },
  target_sys: {
    label: 'Target Land Use System',
    type: 'select' as const,
    required: true,
    options: [
      'Natural Forest',
      'Agroforest',
      'Woodlot/Plantation',
      'Silvopasture',
      'Riparian',
    ],
  },
  distr: {
    label: 'Distribution',
    type: 'select' as const,
    required: true,
    options: ['Partial', 'Full', 'Line'],
  },
  num_trees: {
    label: 'Number of Trees',
    type: 'number' as const,
    placeholder: 'e.g. 18000',
    required: true,
  },
} as const;

export const REQUIRED_ATTRS = Object.keys(POLY_FIELDS) as Array<keyof typeof POLY_FIELDS>;

export const QA_CHECKS = [
  { id: 'q1', cat: 'Geometry', label: 'No self-intersections', critical: true },
  { id: 'q2', cat: 'Geometry', label: 'Polygon is closed', critical: true },
  { id: 'q3', cat: 'Geometry', label: 'No spike artifacts', critical: true },
  { id: 'q4', cat: 'Geometry', label: 'Area < 1,000 ha flag', critical: false },
  { id: 'q5', cat: 'Spatial', label: 'Within expected project area', critical: true },
  { id: 'q6', cat: 'Spatial', label: 'No overlap with other polygons', critical: true },
  { id: 'q7', cat: 'Spatial', label: 'Aligns with satellite imagery', critical: true },
  { id: 'q8', cat: 'Attributes', label: 'All required fields populated', critical: true },
  { id: 'q9', cat: 'Attributes', label: 'Tree count plausible for area', critical: false },
  { id: 'q10', cat: 'Attributes', label: 'Planting date is valid', critical: false },
  { id: 'q11', cat: 'Attributes', label: 'Practice matches land use system', critical: false },
] as const;
