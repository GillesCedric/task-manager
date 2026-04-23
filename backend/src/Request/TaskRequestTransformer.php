<?php

declare(strict_types=1);

namespace App\Request;

use App\DTO\CreateTaskDTO;
use App\DTO\RegisterDTO;
use App\DTO\UpdateTaskDTO;
use App\Enum\TaskPriority;
use App\Enum\TaskStatus;
use App\Service\SanitizationService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use App\Service\AppLogger;

/**
 * @class TaskRequestTransformer
 * @description Pipeline de transformation HTTP → DTO : décode → sanitise → construit → valide.
 *
 * L'ordre est intentionnel et critique :
 *   1. Décodage JSON (structure valide ?)
 *   2. Sanitisation (nettoyage XSS avant toute manipulation)
 *   3. Construction du DTO
 *   4. Validation des contraintes métier
 *
 * Si on validait avant de sanitiser, un input "<script>ab</script>cd" passerait
 * la contrainte Length(min:3) avec la longueur brute, puis serait sanitisé
 * en "cd" (2 caractères) — incohérence silencieuse et bug de validation.
 *
 * @package App\Request
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class TaskRequestTransformer
{
    /**
     * @method __construct
     * @param {ValidatorInterface}   $validator
     * @param {SanitizationService} $sanitization
     */
    public function __construct(
        private readonly ValidatorInterface   $validator,
        private readonly SanitizationService $sanitization,
    ) {}

    /**
     * @method toCreateDTO
     * @description Transforme une requête POST en CreateTaskDTO validé.
     *
     * @param {Request} $request
     * @returns {CreateTaskDTO}
     * @throws BadRequestHttpException
     */
    public function toCreateDTO(Request $request): CreateTaskDTO
    {
        $data = $this->decodeAndSanitize($request, ['title', 'description']);

        $dueDate = null;
        if (!empty($data['due_date'])) {
            $dueDate = \DateTimeImmutable::createFromFormat('Y-m-d', $data['due_date']) ?: null;
        }

        $dto = new CreateTaskDTO(
            title: $data['title']       ?? '',
            listId: (int) ($data['list_id'] ?? 0),
            description: $data['description'] ?? null,
            status: $data['status']      ?? TaskStatus::TODO->value,
            priority: $data['priority']    ?? TaskPriority::MEDIUM->value,
            dueDate: $dueDate,
            assigneeId: isset($data['assignee_id']) ? (int) $data['assignee_id'] : null,
        );

        $this->validate($dto);
        return $dto;
    }

    /**
     * @method toUpdateDTO
     * @description Transforme une requête PATCH en UpdateTaskDTO validé.
     *
     * @param {Request} $request
     * @returns {UpdateTaskDTO}
     * @throws BadRequestHttpException
     */
    public function toUpdateDTO(Request $request): UpdateTaskDTO
    {
        $data = $this->decodeAndSanitize($request, ['title', 'description']);

        $dueDate = null;
        if (array_key_exists('due_date', $data) && !empty($data['due_date'])) {
            $dueDate = \DateTimeImmutable::createFromFormat('Y-m-d', $data['due_date']) ?: null;
        }

        $assigneeProvided = array_key_exists('assignee_id', $data);

        $dto = new UpdateTaskDTO(
            title: $data['title']       ?? null,
            description: $data['description'] ?? null,
            status: $data['status']      ?? null,
            priority: $data['priority']    ?? null,
            dueDate: $dueDate,
            assigneeId: $assigneeProvided ? ($data['assignee_id'] ? (int)$data['assignee_id'] : null) : null,
            assigneeProvided: $assigneeProvided,
        );

        $this->validate($dto);
        return $dto;
    }

    /**
     * @method toRegisterDTO
     * @description Transforme une requête d'inscription en RegisterDTO validé.
     *
     * @param {Request} $request
     * @returns {RegisterDTO}
     * @throws BadRequestHttpException
     */
    public function toRegisterDTO(Request $request): RegisterDTO
    {
        $data = $this->decodeAndSanitize($request, ['name']);

        $dto = new RegisterDTO(
            name: $data['name']     ?? '',
            email: $data['email']    ?? '',
            password: $data['password'] ?? '',
        );
        $this->validate($dto);
        return $dto;
    }

    /**
     * @method decodeAndSanitize
     * @description Décode le JSON et sanitise immédiatement les strings.
     *
     * @param {Request} $request
     * @returns {array<string, mixed>}
     * @throws BadRequestHttpException Si le corps n'est pas un JSON valide
     */
    private function decodeAndSanitize(Request $request, array $fieldsToSanitize = []): array
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new BadRequestHttpException('Le corps de la requête doit être un JSON valide.');
        }

        foreach ($fieldsToSanitize as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $data[$field] = $this->sanitization->sanitizeString($data[$field]);
            }
        }

        return $data;
    }

    /**
     * @method validate
     * @description Valide un DTO et lève une exception avec les erreurs détaillées si invalide.
     * Le corps JSON des erreurs permet au client de savoir précisément quoi corriger.
     *
     * @param {object} $dto
     * @returns {void}
     * @throws BadRequestHttpException Avec les erreurs de validation en JSON
     */
    private function validate(object $dto): void
    {
        $violations = $this->validator->validate($dto);
        if (count($violations) === 0) {
            return;
        }

        $errors = [];
        foreach ($violations as $violation) {
            $errors[$violation->getPropertyPath()] = $violation->getMessage();
        }

        throw new BadRequestHttpException(json_encode($errors));
    }
}
