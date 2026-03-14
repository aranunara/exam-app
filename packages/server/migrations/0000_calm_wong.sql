CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`pass_score` integer,
	`sort_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `choices` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`body` text NOT NULL,
	`is_correct` integer DEFAULT false,
	`explanation` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_choices_question_id` ON `choices` (`question_id`);--> statement-breakpoint
CREATE TABLE `exam_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_set_id` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`question_order` text NOT NULL,
	`total_questions` integer NOT NULL,
	`correct_count` integer,
	`score_percent` integer,
	`started_at` text NOT NULL,
	`completed_at` text,
	`time_spent_sec` integer,
	FOREIGN KEY (`question_set_id`) REFERENCES `question_sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_exam_sessions_user_id` ON `exam_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_exam_sessions_question_set_id` ON `exam_sessions` (`question_set_id`);--> statement-breakpoint
CREATE INDEX `idx_exam_sessions_status` ON `exam_sessions` (`status`);--> statement-breakpoint
CREATE TABLE `question_set_tags` (
	`question_set_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`question_set_id`, `tag_id`),
	FOREIGN KEY (`question_set_id`) REFERENCES `question_sets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `question_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`time_limit` integer,
	`is_published` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_tags` (
	`question_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`question_id`, `tag_id`),
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`question_set_id` text NOT NULL,
	`body` text NOT NULL,
	`explanation` text,
	`is_multi_answer` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`version` integer DEFAULT 1,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`question_set_id`) REFERENCES `question_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_questions_question_set_id` ON `questions` (`question_set_id`);--> statement-breakpoint
CREATE TABLE `session_answer_choices` (
	`session_answer_id` text NOT NULL,
	`choice_id` text NOT NULL,
	PRIMARY KEY(`session_answer_id`, `choice_id`),
	FOREIGN KEY (`session_answer_id`) REFERENCES `session_answers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`question_id` text NOT NULL,
	`choice_order` text NOT NULL,
	`is_correct` integer,
	`is_flagged` integer DEFAULT false,
	`question_version` integer NOT NULL,
	`question_snapshot` text NOT NULL,
	`time_spent_sec` integer,
	`answered_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `exam_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_session_answers_session_id` ON `session_answers` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_answers_question_id` ON `session_answers` (`question_id`);--> statement-breakpoint
CREATE INDEX `idx_session_answers_session_question` ON `session_answers` (`session_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);