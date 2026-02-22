CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('extracurricular','grant','stem_competition','sports','volunteering','other') NOT NULL,
	`externalLink` varchar(2048),
	`submittedBy` varchar(255) NOT NULL,
	`submitterEmail` varchar(320) NOT NULL,
	`deadline` timestamp,
	`isApproved` boolean NOT NULL DEFAULT false,
	`level` enum('both','middle_school','high_school') NOT NULL DEFAULT 'both',
	`type` enum('in_person','online','hybrid') NOT NULL DEFAULT 'in_person',
	`duration` enum('short','medium','long') NOT NULL DEFAULT 'long',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`category` enum('extracurricular','grant','stem_competition','sports','volunteering','other') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userInterests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('extracurricular','grant','stem_competition','sports','volunteering','other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userInterests_id` PRIMARY KEY(`id`)
);
