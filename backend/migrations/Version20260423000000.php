<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * @class Version20260423000000
 * @description Migration v1.2 — table app_logs pour le journal d'application admin.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
final class Version20260423000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Table app_logs pour le journal d\'application (panel admin)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE app_logs (
                id         INT AUTO_INCREMENT NOT NULL,
                level      VARCHAR(20)  NOT NULL DEFAULT \'info\',
                message    TEXT         NOT NULL,
                context    JSON         NOT NULL,
                channel    VARCHAR(30)  DEFAULT NULL,
                created_at DATETIME     NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                INDEX idx_log_level   (level),
                INDEX idx_log_date    (created_at),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS app_logs');
    }
}
