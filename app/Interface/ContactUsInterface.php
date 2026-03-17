<?php

namespace App\Interface;

use App\Models\ContactUs;

interface ContactUsInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null);

    public function getById(int|string $id, array $fields = []): ?ContactUs;

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?ContactUs;

    public function create(array $data): ?ContactUs;

    public function delete(ContactUs $contactUs): void;
}
