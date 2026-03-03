import { getDatabase } from './db';
import type { Project, Site, Polygon, PolygonStatus } from '../types';

// ═══ Project Queries ═══

interface ProjectWithCount extends Project {
  siteCount: number;
}

export async function getProjectById(id: number): Promise<ProjectWithCount | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ProjectWithCount>(
    `SELECT p.*, COUNT(s.id) as siteCount
     FROM projects p
     LEFT JOIN sites s ON s.project_id = p.id
     WHERE p.id = ?
     GROUP BY p.id`,
    [id]
  );
}

// ═══ Site Queries ═══

interface SiteWithCount extends Site {
  polygonCount: number;
  projectName: string;
}

export async function getSitesForProject(projectId: number): Promise<SiteWithCount[]> {
  const db = await getDatabase();
  return db.getAllAsync<SiteWithCount>(
    `SELECT s.*, COUNT(pg.id) as polygonCount, p.name as projectName
     FROM sites s
     LEFT JOIN polygons pg ON pg.site_id = s.id
     JOIN projects p ON p.id = s.project_id
     WHERE s.project_id = ?
     GROUP BY s.id
     ORDER BY s.name`,
    [projectId]
  );
}

export async function getSiteById(id: number): Promise<SiteWithCount | null> {
  const db = await getDatabase();
  return db.getFirstAsync<SiteWithCount>(
    `SELECT s.*, COUNT(pg.id) as polygonCount, p.name as projectName
     FROM sites s
     LEFT JOIN polygons pg ON pg.site_id = s.id
     JOIN projects p ON p.id = s.project_id
     WHERE s.id = ?
     GROUP BY s.id`,
    [id]
  );
}

// ═══ Polygon Queries ═══

export async function getPolygonsForSite(siteId: number): Promise<Polygon[]> {
  const db = await getDatabase();
  return db.getAllAsync<Polygon>(
    `SELECT * FROM polygons WHERE site_id = ? ORDER BY created_at DESC`,
    [siteId]
  );
}

export async function getPolygonById(id: number): Promise<Polygon | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Polygon>(
    `SELECT * FROM polygons WHERE id = ?`,
    [id]
  );
}

export interface CreatePolygonData {
  site_id: number;
  poly_name: string;
  plantstart: string;
  practice: string;
  target_sys: string;
  distr: string;
  num_trees: number;
  status?: PolygonStatus;
  coordinates?: string;
  point_count?: number;
  area_hectares?: number;
}

export async function createPolygon(data: CreatePolygonData): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO polygons (site_id, poly_name, plantstart, practice, target_sys, distr, num_trees, status, coordinates, point_count, area_hectares)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.site_id,
      data.poly_name,
      data.plantstart,
      data.practice,
      data.target_sys,
      data.distr,
      data.num_trees,
      data.status || 'draft',
      data.coordinates || null,
      data.point_count || 0,
      data.area_hectares || null,
    ]
  );
  return result.lastInsertRowId;
}

export interface UpdatePolygonData {
  poly_name?: string;
  plantstart?: string;
  practice?: string;
  target_sys?: string;
  distr?: string;
  num_trees?: number;
  status?: PolygonStatus;
  coordinates?: string;
  point_count?: number;
  area_hectares?: number;
}

export async function updatePolygon(id: number, data: UpdatePolygonData): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.poly_name !== undefined) { fields.push('poly_name = ?'); values.push(data.poly_name); }
  if (data.plantstart !== undefined) { fields.push('plantstart = ?'); values.push(data.plantstart); }
  if (data.practice !== undefined) { fields.push('practice = ?'); values.push(data.practice); }
  if (data.target_sys !== undefined) { fields.push('target_sys = ?'); values.push(data.target_sys); }
  if (data.distr !== undefined) { fields.push('distr = ?'); values.push(data.distr); }
  if (data.num_trees !== undefined) { fields.push('num_trees = ?'); values.push(data.num_trees); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.coordinates !== undefined) { fields.push('coordinates = ?'); values.push(data.coordinates); }
  if (data.point_count !== undefined) { fields.push('point_count = ?'); values.push(data.point_count); }
  if (data.area_hectares !== undefined) { fields.push('area_hectares = ?'); values.push(data.area_hectares ?? null); }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.runAsync(
    `UPDATE polygons SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deletePolygon(id: number): Promise<void> {
  const db = await getDatabase();
  // Delete associated QA reviews first
  await db.runAsync('DELETE FROM qa_reviews WHERE polygon_id = ?', [id]);
  await db.runAsync('DELETE FROM polygons WHERE id = ?', [id]);
}

export async function getPolygonCountForSite(siteId: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM polygons WHERE site_id = ?',
    [siteId]
  );
  return result?.count ?? 0;
}
