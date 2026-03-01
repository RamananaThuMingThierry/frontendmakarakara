<?php

namespace App\Services;

use App\Models\Order;
use App\Repositories\AddressRepository;
use App\Repositories\CityRepository;
use App\Repositories\OrderRepository;
use App\Repositories\PaymentMethodRepository;
use App\Repositories\UserRepository;
use Illuminate\Validation\ValidationException;
use Nette\Utils\Random;

class OrderService
{
    public function __construct(
        private OrderRepository $orderRepository, 
        private UserRepository $userRepository, 
        private PaymentMethodRepository $paymentMethodRepository, 
        private CityRepository $cityRepository, 
        private AddressRepository $addressRepository
    ) {}

    public function getAllOrders(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->orderRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getOrderById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->orderRepository->getById($id, $fields, $relations);
    }

    public function getOrderByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->orderRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createOrder(array $data)
    {
        // Validate required fields
        $requiredFields = ['user_id', 'payment_method_id', 'city_id', 'address_id', 'status', 'payment_status', 'subtotal'];
        
        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data)) {
                throw ValidationException::withMessages([$field => "Le $field est requis."]);
            }
        }

        // Validate user_id exists
        $user = $this->userRepository->getById((int) $data['user_id'], ['id']);
        if (!$user) {
            throw ValidationException::withMessages(['user_id' => 'User non trouvée.']);
        }

        // Validate payment_method_id exists
        $paymentMethod = $this->paymentMethodRepository->getById((int) $data['payment_method_id'], ['id']);
        if (!$paymentMethod) {
            throw ValidationException::withMessages(['payment_method_id' => 'Méthode de paiement non trouvée.']);
        }

        // Validate city_id exists
        $city = $this->cityRepository->getById((int) $data['city_id'], ['id']);
        if (!$city) {
            throw ValidationException::withMessages(['city_id' => 'Ville non trouvée.']);
        }

        // Validate address_id exists
        $address = $this->addressRepository->getById((int) $data['address_id'], ['id']);
        if (!$address) {
            throw ValidationException::withMessages(['address_id' => 'Adresse non trouvée.']);
        }

        // Calculate total if not provided
        if (!isset($data['total'])) {
            $data['total'] = ($data['subtotal'] ?? 0) - ($data['discount_total'] ?? 0) + ($data['delivery_fee'] ?? 0);
        }

        $payload = [
            'order_number' => 'Order-' . date('YmdHis') . '-' . Random::generate(10),
            'user_id' => (int) $data['user_id'],
            'status' => $data['status'],
            'payment_status' => $data['payment_status'],
            'subtotal' => $data['subtotal'],
            'discount_total' => $data['discount_total'] ?? 0,
            'delivery_fee' => $data['delivery_fee'] ?? 0,
            'coupon_code' => $data['coupon_code'] ?? null,
            'payment_method_id' => $data['payment_method_id'],
            'payment_reference' => $data['payment_reference'] ?? null,
            'total' => $data['total'],
            'notes' => $data['notes'] ?? null,
            'city_id' => $data['city_id'],
            'address_id' => $data['address_id'],
        ];
        
        return $this->orderRepository->create($payload);
    }

public function updateOrder(Order $order, array $data)
    {
        $payload = [];

        $fields = [
            'status','payment_status','subtotal','discount_total',
            'delivery_fee','total','notes','city_id','address_id',
            'payment_method_id','payment_reference','coupon_code'
        ];
        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $payload[$f] = $data[$f];
            }
        }

        // validations des références si présentes
        if (array_key_exists('city_id', $payload)) {
            $city = $this->cityRepository->getById((int) $payload['city_id'], ['id']);
            if (!$city) {
                throw ValidationException::withMessages(['city_id' => 'Ville non trouvée.']);
            }
        }

        if (array_key_exists('address_id', $payload)) {
            $address = $this->addressRepository->getById((int) $payload['address_id'], ['id']);
            if (!$address) {
                throw ValidationException::withMessages(['address_id' => 'Adresse non trouvée.']);
            }
        }

        if (array_key_exists('payment_method_id', $payload)) {
            $pm = $this->paymentMethodRepository->getById((int) $payload['payment_method_id'], ['id']);
            if (!$pm) {
                throw ValidationException::withMessages(['payment_method_id' => 'Méthode de paiement non trouvée.']);
            }
        }

        // recalcul automatique du total si des éléments changent et que
        // total n'est pas fourni explicitement
        if (
            ! array_key_exists('total', $payload)
            && (
                array_key_exists('subtotal', $payload)
                || array_key_exists('discount_total', $payload)
                || array_key_exists('delivery_fee', $payload)
            )
        ) {
            $subtotal = $payload['subtotal'] ?? $order->subtotal;
            $discount = $payload['discount_total'] ?? $order->discount_total;
            $delivery = $payload['delivery_fee'] ?? $order->delivery_fee;
            $payload['total'] = $subtotal - $discount + $delivery;
        }

        if (empty($payload)) {
            throw ValidationException::withMessages(['order' => 'Aucune donnée à mettre à jour.']);
        }

        $updated = $this->orderRepository->update($order, $payload);
        if (!$updated) {
            throw ValidationException::withMessages(['order' => 'Mise à jour échouée.']);
        }

        return $updated;
    }

    public function deleteOrder(Order $order): void
    {
        $this->orderRepository->delete($order);
    }
}
