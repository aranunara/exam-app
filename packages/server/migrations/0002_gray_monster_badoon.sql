DROP INDEX `categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `categories` DROP COLUMN `slug`;--> statement-breakpoint
CREATE INDEX `idx_exam_sessions_user_status` ON `exam_sessions` (`user_id`,`status`);