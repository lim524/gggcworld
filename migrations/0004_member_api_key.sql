CREATE TABLE IF NOT EXISTS member_api_key (
 userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
 provider TEXT NOT NULL CHECK(provider IN ('openai','anthropic','google','xai')),
 encrypted TEXT NOT NULL, suffix TEXT NOT NULL, updatedAt INTEGER NOT NULL,
 PRIMARY KEY(userId,provider)
);
