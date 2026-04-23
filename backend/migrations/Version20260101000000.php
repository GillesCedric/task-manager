<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * @class Version20260101000000
 * @description Migration initiale — création des tables users et tasks.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */
final class Version20260101000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création des tables users et tasks avec index de performance';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE users (
                id         INT AUTO_INCREMENT NOT NULL,
                email      VARCHAR(180)       NOT NULL,
                name       VARCHAR(100)       NOT NULL,
                roles      JSON               NOT NULL,
                password   VARCHAR(255)       NOT NULL,
                created_at DATETIME           NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                UNIQUE INDEX UNIQ_EMAIL (email),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');

        $this->addSql('
            CREATE TABLE tasks (
                id          INT AUTO_INCREMENT NOT NULL,
                owner_id    INT                NOT NULL,
                title       VARCHAR(255)       NOT NULL,
                description LONGTEXT           DEFAULT NULL,
                status      VARCHAR(20)        NOT NULL,
                priority    VARCHAR(10)        NOT NULL DEFAULT \'medium\',
                due_date    DATETIME           DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                created_at  DATETIME           NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                updated_at  DATETIME           NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                INDEX idx_task_status   (status),
                INDEX idx_task_priority (priority),
                INDEX idx_task_due_date (due_date),
                INDEX IDX_owner        (owner_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');

        $this->addSql('
            ALTER TABLE tasks
                ADD CONSTRAINT FK_tasks_owner
                FOREIGN KEY (owner_id) REFERENCES users (id)
                ON DELETE CASCADE
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tasks DROP FOREIGN KEY FK_tasks_owner');
        $this->addSql('DROP TABLE tasks');
        $this->addSql('DROP TABLE users');
    }
}
