import type { Landscape } from '../constants/landscapes';

export type UserRole = 'champion' | 'dqa';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  organization: string;
  landscape?: string;
}

export interface Project {
  id: number;
  name: string;
  organization: string;
  landscape: Landscape | 'Unassigned';
  synced: number;
  siteCount?: number;
}

export interface Site {
  id: number;
  project_id: number;
  name: string;
  polygonCount?: number;
}

export type PolygonStatus = 'draft' | 'submitted' | 'needs-review' | 'approved';

export interface Polygon {
  id: number;
  site_id: number;
  poly_name: string;
  plantstart: string;
  practice: string;
  target_sys: string;
  distr: string;
  num_trees: number;
  status: PolygonStatus;
  coordinates?: string;
  point_count: number;
  area_hectares?: number;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface Point {
  id: number;
  site_id: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  elevation?: number;
  satellites?: number;
  note?: string;
  created_at: string;
  synced: number;
}

export interface Photo {
  id: number;
  site_id: number;
  polygon_id?: number;
  file_path: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  note?: string;
  created_at: string;
  synced: number;
}

export interface QAReview {
  id: number;
  polygon_id: number;
  reviewer_name: string;
  checks_json: string;
  result: 'approved' | 'flagged' | 'pending';
  notes?: string;
  created_at: string;
}

// Navigation param types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Project: { projectId: number };
  Site: { siteId: number; projectName: string };
  TrackPolygon: { siteId: number };
  CollectPoint: { siteId: number };
  PolygonDetail: { polygonId: number };
  EditPolygon: { polygonId: number };
  QAReview: { polygonId: number };
};
