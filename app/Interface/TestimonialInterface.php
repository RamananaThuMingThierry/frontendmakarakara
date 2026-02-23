<?php

namespace App\Interface;

use App\Models\Testimonial;

interface TestimonialInterface{

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null);

    public function getById(int|string $id, array $fields = []): ?Testimonial;

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Testimonial;

    public function create(array $data): ?Testimonial;

    public function update(Testimonial $testimonial, array $data): ?Testimonial;

    public function delete(Testimonial $testimonial): void;
}
