CREATE TABLE IF NOT EXISTS world_chunk (
 faction TEXT NOT NULL CHECK(faction IN ('astra','serin','lumi','nox')),
 x INTEGER NOT NULL,y INTEGER NOT NULL,version INTEGER NOT NULL,data TEXT NOT NULL,
 firstDiscoveredBy TEXT REFERENCES user(id) ON DELETE SET NULL,createdAt INTEGER NOT NULL,
 PRIMARY KEY(faction,x,y)
);
CREATE INDEX IF NOT EXISTS world_chunk_discovery_rate ON world_chunk(firstDiscoveredBy,createdAt);
