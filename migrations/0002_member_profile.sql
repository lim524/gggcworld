CREATE TABLE member_profile (
  userId TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 20),
  faction TEXT NOT NULL CHECK(faction IN ('astra','serin','lumi','nox'))
);
CREATE TRIGGER member_faction_immutable
BEFORE UPDATE OF faction ON member_profile
WHEN OLD.faction <> NEW.faction
BEGIN
  SELECT RAISE(ABORT, 'Faction cannot be changed');
END;
