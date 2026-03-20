<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Models\Address;
use App\Services\AddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ClientAddressController extends Controller
{
    public function __construct(private readonly AddressService $addressService) {}

    public function index(Request $request): JsonResponse
    {
        $addresses = $this->addressService->getAllAddresses(
            keys: 'user_id',
            values: $request->user()->id,
            fields: ['*']
        );

        return response()->json([
            'data' => $addresses
                ->sortByDesc(fn (Address $address) => (int) $address->is_default)
                ->values()
                ->map(fn (Address $address) => $this->formatAddress($address)),
        ]);
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $address = $this->addressService->createAddress($request->validated());

        return response()->json([
            'message' => 'Adresse enregistree avec succes.',
            'data' => $this->formatAddress($address),
        ], 201);
    }

    public function update(AddressRequest $request, string $addressId): JsonResponse
    {
        $address = $this->resolveOwnedAddress($request->user()->id, $addressId);

        if (! $address) {
            return response()->json([
                'message' => 'Adresse introuvable.',
            ], 404);
        }

        $updated = $this->addressService->updateAddress($address, $request->validated());

        return response()->json([
            'message' => 'Adresse mise a jour avec succes.',
            'data' => $this->formatAddress($updated),
        ]);
    }

    public function destroy(Request $request, string $addressId): JsonResponse
    {
        $address = $this->resolveOwnedAddress($request->user()->id, $addressId);

        if (! $address) {
            return response()->json([
                'message' => 'Adresse introuvable.',
            ], 404);
        }

        $this->addressService->deleteAddress($address);

        return response()->json([
            'message' => 'Adresse supprimee avec succes.',
        ]);
    }

    private function resolveOwnedAddress(int $userId, string $addressId): ?Address
    {
        $id = ctype_digit($addressId) ? (int) $addressId : decrypt_to_int_or_null($addressId);

        if (! $id) {
            return null;
        }

        return $this->addressService->getAddressByKeys(
            keys: ['id', 'user_id'],
            values: [$id, $userId],
            fields: ['*']
        );
    }

    private function formatAddress(Address $address): array
    {
        return [
            'id' => $address->id,
            'encrypted_id' => $address->encrypted_id,
            'label' => $address->label,
            'full_name' => $address->full_name,
            'phone' => $address->phone,
            'landmark' => $address->landmark,
            'address_line1' => $address->address_line1,
            'address_line2' => $address->address_line2,
            'city_name' => $address->city_name,
            'region' => $address->region,
            'postal_code' => $address->postal_code,
            'country' => $address->country,
            'latitude' => is_null($address->latitude) ? null : (string) $address->latitude,
            'longitude' => is_null($address->longitude) ? null : (string) $address->longitude,
            'is_default' => (bool) $address->is_default,
            'full_address' => $address->full_address,
            'created_at' => optional($address->created_at)->toIso8601String(),
        ];
    }
}
