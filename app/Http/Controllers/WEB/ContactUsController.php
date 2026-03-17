<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactUsRequest;
use App\Mail\ContactUsNotification;
use App\Services\ActivityLogService;
use App\Services\ContactUsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ContactUsController extends Controller
{
    public function __construct(
        private ContactUsService $contactUsService,
        private ActivityLogService $activityLogService
    ) {}

    public function index()
    {
        try {
            $contacts = $this->contactUsService->getAllContacts(
                [],
                [],
                ['id', 'name', 'email', 'phone', 'subject', 'message', 'created_at']
            );

            return response()->json([
                'data' => $contacts,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_contact_failed',
                'entity_type' => 'ContactUs',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.contacts.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des messages de contact.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des messages de contact.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

public function store(ContactUsRequest $request)
{
    $data = $request->validated();

    try {
        $contact = DB::transaction(function () use ($data) {

            $contact = $this->contactUsService->createContact($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_contact',
                'entity_type' => 'ContactUs',
                'entity_id' => $contact->id,
                'color' => 'success',
                'method' => 'POST',
                'route' => 'contact.store',
                'status_code' => 201,
                'message' => 'Message de contact envoyé avec succès.',
                'metadata' => [
                    'contact_id' => $contact->id,
                    'email' => $contact->email,
                    'subject' => $contact->subject,
                ],
            ]);

            DB::afterCommit(function () use ($contact) {
                Mail::to(config('mail.admin_address'))
                    ->send(new ContactUsNotification($contact));
            });

            return $contact;
        });

        return response()->json([
            'message' => 'Message envoyé avec succès.',
            'data' => $contact,
        ], 201);
    } catch (Throwable $e) {
        $this->activityLogService->createActivityLog([
            'user_id' => auth()->id(),
            'action' => 'create_contact_failed',
            'entity_type' => 'ContactUs',
            'entity_id' => null,
            'color' => 'danger',
            'method' => 'POST',
            'route' => 'contact.store',
            'status_code' => 500,
            'message' => 'Erreur lors de l\'envoi du message de contact.',
            'metadata' => [
                'error' => $e->getMessage(),
            ],
        ]);

        return response()->json([
            'message' => 'Erreur lors de l\'envoi du message de contact.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            return response()->json([
                'message' => 'ID de contact invalide.',
            ], 400);
        }

        try {
            $contact = $this->contactUsService->getContactById($id, ['*']);

            if (! $contact) {
                return response()->json([
                    'message' => 'Message de contact non trouve.',
                ], 404);
            }

            return response()->json([
                'data' => $contact,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_contact_failed',
                'entity_type' => 'ContactUs',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.contacts.show',
                'status_code' => 500,
                'message' => 'Erreur lors de la recuperation du message de contact.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la recuperation du message de contact.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            return response()->json([
                'message' => 'ID de contact invalide.',
            ], 400);
        }

        try {
            $contact = $this->contactUsService->getContactById($id, ['*']);

            if (! $contact) {
                return response()->json([
                    'message' => 'Message de contact non trouve.',
                ], 404);
            }

            $this->contactUsService->deleteContact($contact);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_contact',
                'entity_type' => 'ContactUs',
                'entity_id' => $id,
                'color' => 'success',
                'method' => 'DELETE',
                'route' => 'admin.contacts.destroy',
                'status_code' => 200,
                'message' => 'Message de contact supprime avec succes.',
                'metadata' => [
                    'contact_id' => $id,
                ],
            ]);

            return response()->json([
                'message' => 'Message de contact supprime avec succes.',
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_contact_failed',
                'entity_type' => 'ContactUs',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.contacts.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression du message de contact.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression du message de contact.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
