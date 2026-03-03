import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('terramatch.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('champion', 'dqa')),
      organization TEXT NOT NULL,
      landscape TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      landscape TEXT NOT NULL CHECK(landscape IN (
        'Greater Rift Valley', 'Lake Kivu & Rusizi', 'Ghana Cocoa Belt', 'Unassigned'
      )),
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS polygons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      poly_name TEXT NOT NULL,
      plantstart TEXT NOT NULL,
      practice TEXT NOT NULL CHECK(practice IN (
        'Tree Planting', 'Direct Seeding', 'Assisted Natural Regeneration (ANR)'
      )),
      target_sys TEXT NOT NULL CHECK(target_sys IN (
        'Natural Forest', 'Agroforest', 'Woodlot/Plantation', 'Silvopasture', 'Riparian'
      )),
      distr TEXT NOT NULL CHECK(distr IN ('Partial', 'Full', 'Line')),
      num_trees INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
        'draft', 'submitted', 'needs-review', 'approved'
      )),
      coordinates TEXT,
      point_count INTEGER DEFAULT 0,
      area_hectares REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      elevation REAL,
      satellites INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      polygon_id INTEGER,
      file_path TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (polygon_id) REFERENCES polygons(id)
    );

    CREATE TABLE IF NOT EXISTS qa_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      polygon_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      checks_json TEXT NOT NULL,
      result TEXT CHECK(result IN ('approved', 'flagged', 'pending')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (polygon_id) REFERENCES polygons(id)
    );
  `);
}

export async function isDatabaseSeeded(): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM projects'
  );
  return (result?.count ?? 0) > 0;
}
