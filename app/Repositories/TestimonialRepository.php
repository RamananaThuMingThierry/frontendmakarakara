<?php

namespace App\Repositories;

use App\Interface\TestimonialInterface;
use App\Models\Testimonial;
use App\Repositories\BaseRepository;

class TestimonialRepository extends BaseRepository implements TestimonialInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Testimonial::query();
        $query = $this->applyFilter($query, $keys, $values);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = []): ?Testimonial
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Testimonial::query();

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?Testimonial
    {
        $fields = $this->withRequiredColumns($fields);

        $query = Testimonial::query();
        $query = $this->applyFilter($query, $keys, $values);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?Testimonial
    {
        return Testimonial::create($data);
    }

    public function update(Testimonial $testimonial, array $data): ?Testimonial
    {
        $testimonial->update($data);
        return $testimonial;
    }

    public function delete(Testimonial $testimonial): void
    {
        $testimonial->delete();
    }
}
