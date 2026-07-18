-- Migration to support daily streaks, calorie counts, user physical attributes, and daily fitness goals
ALTER TABLE users ADD COLUMN height_cm INTEGER;
ALTER TABLE users ADD COLUMN weight_kg INTEGER;
ALTER TABLE users ADD COLUMN age INTEGER;
ALTER TABLE users ADD COLUMN streak_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_walk_date DATE;
ALTER TABLE users ADD COLUMN daily_step_goal INTEGER NOT NULL DEFAULT 10000;
ALTER TABLE users ADD COLUMN daily_calorie_goal INTEGER NOT NULL DEFAULT 300;

ALTER TABLE walks ADD COLUMN calories_burnt INTEGER;
