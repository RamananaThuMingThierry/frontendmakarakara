<?php

namespace App\Services;

use App\Models\Address;
use App\Repositories\AddressRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddressService
{
    public function __construct(private AddressRepository $addressRepository) {}

    public function getAllAddresses(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null)
    {
        return $this->addressRepository->getAll($keys, $values, $fields, $relations, $withTrashed, $onlyTrashed, $paginate);
    }

    public function getAddressById(int|string $id, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false)
    {
        return $this->addressRepository->getById($id, $fields, $relations, $withTrashed, $onlyTrashed);
    }

    public function getAddressByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false){
        return $this->addressRepository->getByKeys($keys, $values, $fields, $relations, $withTrashed , $onlyTrashed);
    }

    public function createAddress(array $data): Address
    {
        return DB::transaction(function () use ($data) {

            $userId = auth()->id();

            if (!$userId) {
                throw ValidationException::withMessages([
                    'user' => 'Utilisateur non authentifié.',
                ]);
            }

            // Champs qui définissent "une adresse identique"
            $fields = [
                'label',
                'full_name',
                'phone',
                'landmark',
                'address_line1',
                'address_line2',
                'city_name',
                'region',
                'postal_code',
                'country',
                'latitude',
                'longitude',
            ];

            // Normalisation (trim + null si vide)
            $payload = [];
            foreach ($fields as $field) {
                if (!array_key_exists($field, $data)) {
                    $payload[$field] = null;
                    continue;
                }

                $value = $data[$field];

                if (is_string($value)) {
                    $value = trim($value);
                    $value = $value === '' ? null : $value;
                }

                // cast pour lat/lng (optionnel)
                if (in_array($field, ['latitude', 'longitude'], true)) {
                    $value = ($value === '' || $value === null) ? null : (float) $value;
                }

                $payload[$field] = $value;
            }

            $payload['user_id'] = $userId;

            // 1) Chercher une adresse identique
            $query = Address::query()->where('user_id', $userId);

            foreach ($fields as $field) {
                $value = $payload[$field] ?? null;
                $value === null ? $query->whereNull($field) : $query->where($field, $value);
            }

            $existing = $query->first();

            // 2) Si identique existe => la mettre default si pas déjà
            if ($existing) {
                if (!$existing->is_default) {
                    Address::where('user_id', $userId)->update(['is_default' => false]);
                    $existing->update(['is_default' => true]);
                }

                return $existing->fresh();
            }

            // 3) Sinon => nouvelle adresse : elle devient default + autres à false
            Address::where('user_id', $userId)->update(['is_default' => false]);
            $payload['is_default'] = true;

            $address = $this->addressRepository->create($payload);

            if (!$address) {
                throw ValidationException::withMessages([
                    'address' => 'Création échouée.',
                ]);
            }

            return $address;
        });
    }

    public function updateAddress(Address $address, array $data): Address
    {
        return DB::transaction(function () use ($address, $data) {

            $userId = auth()->id();

            if (!$userId) {
                throw ValidationException::withMessages([
                    'user' => 'Utilisateur non authentifié.',
                ]);
            }

            if($address->user_id !== $userId){
                throw ValidationException::withMessages([
                    'address' => 'Accès à l\'adresse refusé.',
                ]);
            }


            $payload = [];

            foreach (['label', 'full_name', 'phone', 'landmark', 'address_line1', 'address_line2', 'city_name', 'region', 'postal_code', 'country'] as $field) {
                if (array_key_exists($field, $data)) {
                     $value = $data[$field];

                    if (is_string($value)) {
                        $value = trim($value);
                        $value = $value === '' ? null : $value;
                    }

                    $payload[$field] = $value;
                }
            }

            $setDefault = false;
            if (array_key_exists('is_default', $data)) {
                $setDefault = (bool) $data['is_default'];
                $payload['is_default'] = (bool)$setDefault;
            }

            foreach (['latitude', 'longitude'] as $field) {
                if (array_key_exists($field, $data)) {
                    $payload[$field] = ($data[$field] === '') ? null : (float)$data[$field];
                }
            }

            if (empty($payload)) {
                throw ValidationException::withMessages([
                    'address' => 'Aucune donnée à mettre à jour.',
                ]);
            }

            // ✅ Si l'utilisateur veut mettre cette adresse en default :
            // -> on met toutes les autres adresses du user à false
            if ($setDefault) {
                Address::where('user_id', $userId)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);

                $payload['is_default'] = true;
            }

            $updatedAddress = $this->addressRepository->update($address, $payload);

            if (!$updatedAddress) {
                throw ValidationException::withMessages([
                    'address' => 'Mise à jour échouée.',
                ]);
            }

            return $updatedAddress;
        });
    }

    public function deleteAddress(Address $address): void
    {
        $payload = [
            'is_default' => false,
        ];

        $this->addressRepository->update($address, $payload);

        $this->addressRepository->delete($address);
    }

    public function restoreAddress(Address $address): void
    {
        $this->addressRepository->restore($address);
    }

    public function forceDeleteAddress(Address $address): void
    {
        $this->addressRepository->forceDelete($address);
    }
}
