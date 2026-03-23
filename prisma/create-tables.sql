-- Phase 4: Create all tables for DoonPortal Lead Generation Engine
-- Database: dp

USE dp;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `organization` VARCHAR(191) NULL,
  `city` VARCHAR(191) NULL,
  `state` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `message` TEXT NULL,
  `product_interest` VARCHAR(191) NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'website',
  `status` VARCHAR(191) NOT NULL DEFAULT 'new',
  `score` INT NOT NULL DEFAULT 0,
  `next_followup_date` DATETIME(3) NULL,
  `followup_status` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `leads_email_idx` (`email`),
  INDEX `leads_phone_idx` (`phone`),
  INDEX `leads_status_idx` (`status`),
  INDEX `leads_city_idx` (`city`),
  INDEX `leads_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `demo_bookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL,
  `scheduled_date` VARCHAR(191) NOT NULL,
  `scheduled_time` VARCHAR(191) NOT NULL,
  `meeting_link` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `demo_bookings_lead_id_idx` (`lead_id`),
  INDEX `demo_bookings_status_idx` (`status`),
  INDEX `demo_bookings_scheduled_date_idx` (`scheduled_date`),
  CONSTRAINT `demo_bookings_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `activities_lead_id_idx` (`lead_id`),
  CONSTRAINT `activities_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'sales',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead_tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL,
  `tag_name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `lead_tags_lead_id_tag_name_key` (`lead_id`, `tag_name`),
  INDEX `lead_tags_lead_id_idx` (`lead_id`),
  INDEX `lead_tags_tag_name_idx` (`tag_name`),
  CONSTRAINT `lead_tags_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `product` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `campaigns_status_idx` (`status`),
  INDEX `campaigns_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `campaign_id` INT NOT NULL,
  `lead_id` INT NOT NULL,
  `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `campaign_leads_campaign_id_lead_id_key` (`campaign_id`, `lead_id`),
  INDEX `campaign_leads_campaign_id_idx` (`campaign_id`),
  INDEX `campaign_leads_lead_id_idx` (`lead_id`),
  CONSTRAINT `campaign_leads_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `campaign_leads_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `whatsapp_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `whatsapp_logs_lead_id_idx` (`lead_id`),
  INDEX `whatsapp_logs_status_idx` (`status`),
  CONSTRAINT `whatsapp_logs_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_rules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `trigger` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `template_id` INT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default email templates
INSERT INTO `email_templates` (`name`, `subject`, `body`, `created_at`) VALUES
('School Demo Invitation', 'Experience DoonPortal School ERP - Book Your Free Demo', '<h2>Hi {{name}},</h2><p>We noticed {{organization}} might benefit from our School Management System.</p><p>DoonPortal ERP helps schools streamline admissions, attendance, fees, and more.</p><p><strong>Book a free demo today!</strong></p><p>Best regards,<br>DoonPortal Team</p>', NOW()),
('Follow-up After Demo', 'Thank you for attending the DoonPortal demo, {{name}}!', '<h2>Hi {{name}},</h2><p>Thank you for taking the time to see DoonPortal in action.</p><p>We hope the demo gave you a clear picture of how we can help {{organization}}.</p><p>Ready to get started? Reply to this email or call us.</p><p>Best regards,<br>DoonPortal Team</p>', NOW()),
('Reminder Message', 'Reminder: Your DoonPortal Demo is Coming Up!', '<h2>Hi {{name}},</h2><p>Just a friendly reminder about your upcoming demo with DoonPortal.</p><p>We look forward to showing you how our solution can transform {{organization}}.</p><p>See you soon!</p><p>Best regards,<br>DoonPortal Team</p>', NOW());

-- Seed default automation rules
INSERT INTO `automation_rules` (`name`, `trigger`, `action`, `template_id`, `enabled`, `created_at`) VALUES
('Welcome Email on New Lead', 'new_lead', 'send_email', 1, 1, NOW()),
('Follow-up Reminder (2 days)', 'no_contact_2days', 'mark_followup', NULL, 1, NOW()),
('Post-Demo Follow-up', 'demo_completed', 'send_email', 2, 1, NOW());
