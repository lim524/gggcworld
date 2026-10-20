CREATE INDEX IF NOT EXISTS member_profile_name_lookup ON member_profile(name COLLATE NOCASE);

CREATE TRIGGER IF NOT EXISTS member_profile_unique_name_insert BEFORE INSERT ON member_profile WHEN EXISTS (SELECT 1 FROM member_profile WHERE name = NEW.name COLLATE NOCASE AND userId <> NEW.userId) BEGIN SELECT RAISE(ABORT, 'nickname_taken'); END;

CREATE TRIGGER IF NOT EXISTS member_profile_unique_name_update BEFORE UPDATE OF name ON member_profile WHEN EXISTS (SELECT 1 FROM member_profile WHERE name = NEW.name COLLATE NOCASE AND userId <> NEW.userId) BEGIN SELECT RAISE(ABORT, 'nickname_taken'); END;
