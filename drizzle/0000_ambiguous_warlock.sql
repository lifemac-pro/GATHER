CREATE TABLE `GATHER_post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256),
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `GATHER_registration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(255) NOT NULL,
	`event_title` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `name_idx` ON `GATHER_post` (`name`);--> statement-breakpoint
CREATE INDEX `event_idx` ON `GATHER_registration` (`event_title`);