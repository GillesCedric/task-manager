<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * @class Version20260424000000
 * @description Migration v1.3 — table action_logs pour l'audit trail entreprise.
 * Remplace app_logs (généraliste) par action_logs (audit trail structuré).
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
final class Version20260424000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Audit trail action_logs — logging entreprise structuré (remplace app_logs)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE action_logs (
                id            INT AUTO_INCREMENT NOT NULL,
                action        VARCHAR(60)  NOT NULL,
                level         VARCHAR(20)  NOT NULL DEFAULT \'action\',
                user_id       INT          DEFAULT NULL,
                user_name     VARCHAR(100) DEFAULT NULL,
                resource_type VARCHAR(40)  DEFAULT NULL,
                resource_id   INT          DEFAULT NULL,
                ip_address    VARCHAR(45)  DEFAULT NULL,
                duration_ms   INT          DEFAULT NULL,
                metadata      JSON         NOT NULL,
                created_at    DATETIME     NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                INDEX idx_alog_action   (action),
                INDEX idx_alog_level    (level),
                INDEX idx_alog_user     (user_id),
                INDEX idx_alog_resource (resource_type),
                INDEX idx_alog_date     (created_at),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');

        // On conserve app_logs pour compatibilité mais on peut la vider
        $this->addSql('TRUNCATE TABLE app_logs');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS action_logs');
    }
}
