CREATE TABLE `donations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`donorName` varchar(255) NOT NULL,
	`donorEmail` varchar(320),
	`amountInCents` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'CAD',
	`tier` varchar(50) NOT NULL DEFAULT 'supporter',
	`message` text,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`showOnWall` boolean NOT NULL DEFAULT true,
	`paymentMethod` varchar(50) NOT NULL DEFAULT 'stripe',
	`status` enum('completed','pledged','refunded') NOT NULL DEFAULT 'completed',
	`transactionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `donations_id` PRIMARY KEY(`id`)
);
