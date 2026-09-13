CREATE TABLE `suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('opportunity','source') NOT NULL,
	`title` varchar(255) NOT NULL,
	`organization` varchar(255),
	`url` varchar(2048),
	`category` enum('extracurricular','grant','stem_competition','sports','volunteering','experiential_learning','other'),
	`targetAge` varchar(100),
	`description` text NOT NULL,
	`notes` text,
	`submitterName` varchar(255),
	`submitterEmail` varchar(320),
	`status` enum('pending','approved','rejected','converted') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suggestions_id` PRIMARY KEY(`id`)
);
