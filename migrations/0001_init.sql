PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  local_date TEXT NOT NULL,
  eaten_at TEXT NOT NULL,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  restaurant TEXT,
  source TEXT NOT NULL,
  confidence REAL NOT NULL,
  assumptions_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_local_date
  ON meals(local_date, eaten_at);

CREATE TABLE IF NOT EXISTS meal_items (
  id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  serving_description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  fiber_g REAL NOT NULL,
  confidence REAL NOT NULL,
  assumptions_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal
  ON meal_items(meal_id, sort_order);

CREATE TABLE IF NOT EXISTS weights (
  id TEXT PRIMARY KEY,
  local_date TEXT NOT NULL UNIQUE,
  weight REAL NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  calorie_goal REAL,
  protein_goal_g REAL,
  carbs_goal_g REAL,
  fat_goal_g REAL,
  fiber_goal_g REAL,
  target_weight REAL,
  weight_unit TEXT NOT NULL DEFAULT 'lb',
  weekly_loss_goal REAL,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  restaurant TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_meal_items (
  id TEXT PRIMARY KEY,
  saved_meal_id TEXT NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  serving_description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  fiber_g REAL NOT NULL,
  confidence REAL NOT NULL,
  assumptions_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_saved_meal_items_parent
  ON saved_meal_items(saved_meal_id, sort_order);
