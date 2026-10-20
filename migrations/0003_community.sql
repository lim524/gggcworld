CREATE TABLE IF NOT EXISTS community_post (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  faction TEXT NOT NULL CHECK(faction IN ('astra','serin','lumi','nox')),
  category TEXT NOT NULL CHECK(category IN ('자유','정보','질문','프롬프트','창작')),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),
  views INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  deletedAt INTEGER
);
CREATE INDEX IF NOT EXISTS community_post_feed ON community_post(deletedAt, id DESC);
CREATE INDEX IF NOT EXISTS community_post_faction ON community_post(faction, deletedAt, id DESC);
CREATE INDEX IF NOT EXISTS community_post_author ON community_post(authorId, createdAt DESC);
CREATE TABLE IF NOT EXISTS community_comment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL REFERENCES community_post(id) ON DELETE CASCADE,
  authorId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
  createdAt INTEGER NOT NULL,
  deletedAt INTEGER
);
CREATE INDEX IF NOT EXISTS community_comment_post ON community_comment(postId, deletedAt, id);
CREATE INDEX IF NOT EXISTS community_comment_author ON community_comment(authorId, createdAt DESC);
CREATE TABLE IF NOT EXISTS community_vote (
  postId INTEGER NOT NULL REFERENCES community_post(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  PRIMARY KEY(postId, userId)
);
