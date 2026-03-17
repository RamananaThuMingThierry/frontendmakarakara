<?php

namespace App\Repositories;

use App\Interface\ContactUsInterface;
use App\Models\ContactUs;
use App\Repositories\BaseRepository;

class ContactUsRepository extends BaseRepository implements ContactUsInterface
{
    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ContactUs::query();
        $query = $this->applyFilter($query, $keys, $values);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string $id, array $fields = []): ?ContactUs
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ContactUs::query();

        return empty($fields) ? $query->find($id) : $query->select($fields)->where('id', $id)->first();
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = []): ?ContactUs
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ContactUs::query();
        $query = $this->applyFilter($query, $keys, $values);

        return empty($fields) ? $query->first() : $query->select($fields)->first();
    }

    public function create(array $data): ?ContactUs
    {
        return ContactUs::create($data);
    }

    public function delete(ContactUs $contactUs): void
    {
        $contactUs->delete();
    }
}
