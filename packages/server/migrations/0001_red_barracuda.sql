CREATE TABLE `question_confidence` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`level` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_question_confidence_user_question` ON `question_confidence` (`user_id`,`question_id`);--> statement-breakpoint
CREATE INDEX `idx_question_confidence_user_id` ON `question_confidence` (`user_id`);