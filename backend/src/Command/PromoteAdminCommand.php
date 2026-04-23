<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\UserRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name:        'app:promote-admin',
    description: 'Accorde le rôle ROLE_ADMIN à un utilisateur par email.',
)]
final class PromoteAdminCommand extends Command
{
    public function __construct(private readonly UserRepository $userRepository)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('email', InputArgument::REQUIRED, 'Email de l\'utilisateur');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io    = new SymfonyStyle($input, $output);
        $email = $input->getArgument('email');

        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            $io->error("Utilisateur '{$email}' introuvable.");
            return Command::FAILURE;
        }

        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            $io->warning("{$user->getName()} est déjà administrateur.");
            return Command::SUCCESS;
        }

        $user->setRoles(['ROLE_ADMIN']);
        $this->userRepository->save($user);

        $io->success("{$user->getName()} ({$email}) est maintenant administrateur.");
        return Command::SUCCESS;
    }
}
