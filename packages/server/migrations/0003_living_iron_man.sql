DROP INDEX `tags_name_unique`;--> statement-breakpoint
ALTER TABLE `tags` ADD `user_id` text NOT NULL DEFAULT '__PLACEHOLDER__';--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tags_user_name` ON `tags` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_tags_user_id` ON `tags` (`user_id`);--> statement-breakpoint
ALTER TABLE `categories` ADD `user_id` text NOT NULL DEFAULT '__PLACEHOLDER__';--> statement-breakpoint
CREATE INDEX `idx_categories_user_id` ON `categories` (`user_id`);--> statement-breakpoint
ALTER TABLE `question_sets` ADD `user_id` text NOT NULL DEFAULT '__PLACEHOLDER__';--> statement-breakpoint
CREATE INDEX `idx_question_sets_user_id` ON `question_sets` (`user_id`);