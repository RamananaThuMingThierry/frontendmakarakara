<?php

namespace App\Services;

use App\Models\ContactUs;
use App\Repositories\ContactUsRepository;
use Illuminate\Validation\ValidationException;

class ContactUsService
{
    public function __construct(private ContactUsRepository $contactUsRepository) {}

    public function getAllContacts(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        return $this->contactUsRepository->getAll($keys, $values, $fields, $paginate);
    }

    public function getContactById(int|string $id, array $fields = [])
    {
        return $this->contactUsRepository->getById($id, $fields);
    }

    public function getContactByKeys(string|array $keys, mixed $values, array $fields = [])
    {
        return $this->contactUsRepository->getByKeys($keys, $values, $fields);
    }

    public function createContact(array $data): ContactUs
    {
        $payload = [
            'name' => trim((string) ($data['name'] ?? '')),
            'email' => trim((string) ($data['email'] ?? '')),
            'phone' => isset($data['phone']) ? trim((string) $data['phone']) : null,
            'subject' => trim((string) ($data['subject'] ?? '')),
            'message' => trim((string) ($data['message'] ?? '')),
        ];

        if ($payload['name'] === '' || $payload['email'] === '' || $payload['subject'] === '' || $payload['message'] === '') {
            throw ValidationException::withMessages([
                'contact' => 'Les champs obligatoires du formulaire de contact sont manquants.',
            ]);
        }

        $contact = $this->contactUsRepository->create($payload);

        if (! $contact) {
            throw ValidationException::withMessages([
                'contact' => 'Creation du message de contact echouee.',
            ]);
        }

        return $contact;
    }

    public function deleteContact(ContactUs $contactUs): void
    {
        $this->contactUsRepository->delete($contactUs);
    }
}
