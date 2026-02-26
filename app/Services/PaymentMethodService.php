<?php

namespace App\Services;

use App\Models\PaymentMethod;
use App\Repositories\PaymentMethodRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class PaymentMethodService
{
    public function __construct(private PaymentMethodRepository $paymentMethodService) {}

    public function getAllPaymentMethods(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->paymentMethodService->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getPaymentMethodById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->paymentMethodService->getById($id, $fields, $relations);
    }

    public function getPaymentMethodByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->paymentMethodService->getByKeys($keys, $values, $fields, $relations);
    }

    public function createPaymentMethod(array $data)
    {
        $name = trim((string) ($data['name'] ?? ''));

        $payload = [
            'name' => $name,
            'code' => $data['code'], 
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
        ];

        // ✅ Gestion de l'image (image)
        if (!empty($data['image']) && $data['image'] instanceof UploadedFile) {

            $extension = $data['image']->getClientOriginalExtension();
            $filename = 'paymentmethod-' . time() . '.' . $extension;

            $destination = public_path('images/paymentmethods');

            // crée le dossier s'il n'existe pas
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['image']->move($destination, $filename);

            // chemin enregistré en DB
            $payload['image'] = 'images/paymentmethods/' . $filename;
        }

        $paymentMethod = $this->paymentMethodService->create($payload);

        if (!$paymentMethod) {
            throw ValidationException::withMessages([
                'paymentMethod' => 'Création échouée.',
            ]);
        }

        return $paymentMethod;
    }

    public function updatePaymentMethod(PaymentMethod $paymentMethod, array $data)
    {

        $payload = [];

        if(array_key_exists('name', $data)){
            $name = trim((string) $data['name']);
            if($name == ''){
                throw ValidationException::withMessages([
                    'name' => 'Le champ name est requis.',
                ]);
            }
            
            $payload['name'] = $name;
        }

        if(array_key_exists('code', $data)){
            $payload['code'] = $data['code'];
        }

        // is_actives
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }

        // ✅ image (upload dans public/images/paymentmethods)
        if (!empty($data['image']) && $data['image'] instanceof UploadedFile) {
            // supprimer ancienne image si existe
            if (!empty($paymentMethod->image)) {

                $oldPath = public_path($paymentMethod->image);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }

            }

            $extension = $data['image']->getClientOriginalExtension();

            $filename =  'paymentmethod-' . time() . '.' . $extension;

            $destination = public_path('images/paymentmethods');

            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['image']->move($destination, $filename);

            $payload['image'] = 'images/paymentmethods/' . $filename;
        }

        // rien à update ?
        if (empty($payload)) {
            throw ValidationException::withMessages([
                'paymentmethod' => 'Aucune donnée à mettre à jour.',
            ]);
        }

        $updated = $this->paymentMethodService->update($paymentMethod, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'paymentmethod' => 'Mise à jour échouée.',
            ]);
        }

        return $updated;
    }

    public function deletePaymentMethod(PaymentMethod $paymentMethod): void
    {
        // supprimer ancienne image si existe
        if (!empty($paymentMethod->image)) {
            $oldPath = public_path($paymentMethod->image);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->paymentMethodService->delete($paymentMethod);
    }
}
