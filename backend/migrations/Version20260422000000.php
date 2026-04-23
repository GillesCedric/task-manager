<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * @class Version20260422000000
 * @description Migration v1.1 — listes de tâches, membres, notifications, avatar, assignee.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
final class Version20260422000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Listes de tâches, membres, notifications, avatar utilisateur, assignee';
    }

    public function up(Schema $schema): void
    {
        // Avatar et bio sur les utilisateurs
        $this->addSql('ALTER TABLE users ADD avatar_url LONGTEXT DEFAULT NULL, ADD bio VARCHAR(300) DEFAULT NULL');

        // Table task_lists
        $this->addSql('
            CREATE TABLE task_lists (
                id                  INT AUTO_INCREMENT NOT NULL,
                owner_id            INT NOT NULL,
                name                VARCHAR(100) NOT NULL,
                description         LONGTEXT DEFAULT NULL,
                color               VARCHAR(7) NOT NULL DEFAULT \'#3b82f6\',
                invite_token        VARCHAR(64) DEFAULT NULL,
                default_invite_role VARCHAR(10) DEFAULT \'reader\',
                created_at          DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                updated_at          DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                UNIQUE INDEX UNIQ_INVITE_TOKEN (invite_token),
                INDEX IDX_tl_owner (owner_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
        $this->addSql('ALTER TABLE task_lists ADD CONSTRAINT FK_tl_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE');

        // Table task_list_members
        $this->addSql('
            CREATE TABLE task_list_members (
                id           INT AUTO_INCREMENT NOT NULL,
                task_list_id INT NOT NULL,
                user_id      INT NOT NULL,
                role         VARCHAR(10) NOT NULL DEFAULT \'reader\',
                joined_at    DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                UNIQUE INDEX UNIQ_MEMBER (task_list_id, user_id),
                INDEX IDX_tlm_list (task_list_id),
                INDEX IDX_tlm_user (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
        $this->addSql('ALTER TABLE task_list_members ADD CONSTRAINT FK_tlm_list FOREIGN KEY (task_list_id) REFERENCES task_lists (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE task_list_members ADD CONSTRAINT FK_tlm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');

        // Modifier tasks — ajouter task_list_id et assignee_id, supprimer owner_id direct
        $this->addSql('ALTER TABLE tasks ADD task_list_id INT NOT NULL, ADD assignee_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE tasks ADD CONSTRAINT FK_task_list FOREIGN KEY (task_list_id) REFERENCES task_lists (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tasks ADD CONSTRAINT FK_task_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_task_list ON tasks (task_list_id)');
        $this->addSql('CREATE INDEX IDX_task_assignee ON tasks (assignee_id)');

        // Table notifications
        $this->addSql('
            CREATE TABLE notifications (
                id           INT AUTO_INCREMENT NOT NULL,
                recipient_id INT NOT NULL,
                actor_id     INT DEFAULT NULL,
                type         VARCHAR(30) NOT NULL,
                payload      JSON NOT NULL,
                is_read      TINYINT(1) NOT NULL DEFAULT 0,
                created_at   DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                INDEX idx_notif_recipient_read (recipient_id, is_read),
                INDEX IDX_notif_actor (actor_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        ');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_notif_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_notif_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tasks DROP FOREIGN KEY FK_task_list');
        $this->addSql('ALTER TABLE tasks DROP FOREIGN KEY FK_task_assignee');
        $this->addSql('ALTER TABLE tasks DROP task_list_id, DROP assignee_id');
        $this->addSql('DROP TABLE task_list_members');
        $this->addSql('DROP TABLE task_lists');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('ALTER TABLE users DROP avatar_url, DROP bio');
    }
}