<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserService{

    public function __construct(private UserRepository $userRepository){}

    public function getAllUsers(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null){
        return $this->userRepository->getAll($keys, $values, $fields, $relations, $withTrashed, $onlyTrashed, $paginate);
    }

    public function getUserById(int|string $id, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false){
        return $this->userRepository->getById($id, $fields, $relations, $withTrashed, $onlyTrashed);
    }

    public function getUserByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false){
        return $this->userRepository->getByKeys($keys, $values, $fields, $relations, $withTrashed, $onlyTrashed);
    }

    public function createUser(array $data){

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'status' => isset($data['status']) ? (string) $data['status'] : 'active', 
        ];

        // ✅ Gestion de profil user (avatar)
        if (!empty($data['avatar']) && $data['avatar'] instanceof UploadedFile) {
            $extension = $data['avatar']->getClientOriginalExtension();
            $filename = 'user-' . time() . '.' . $extension;

            $destination = public_path('images/users');

            // crée le dossier s'il n'existe pas
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['avatar']->move($destination, $filename);

            $payload['avatar'] = 'images/users/' . $filename;
        }

        $user = $this->userRepository->create($payload);

        if(!$user){
            throw ValidationException::withMessages([
                'User' => 'Création échouée.',
            ]);
        }

        $user->syncRoles($data['role']);

        return $user;
    }

    public function updateUser(int|string $id, array $data){
        
        $user = $this->userRepository->getById($id);

        $payload = [];

        if(array_key_exists('name', $data)){
            $name = trim((string)$data['name']);

            if($name === ''){
                throw ValidationException::withMessages([
                    'name' => 'Le nom ne peut pas être vide.',
                ]);
            }

            $payload['name'] = $name;
        }

        if(array_key_exists('email', $data)){
            $payload['email'] = $data['email'];
        }
        
        if(array_key_exists('phone', $data)){
            $payload['phone'] = $data['phone'];
        }

        // is_active
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = $data['is_active'] ?? 'active';
        }

        if(array_key_exists('avatar', $data)){

            // ✅ Gestion de profil user (avatar)
            if (!empty($data['avatar']) && $data['avatar'] instanceof UploadedFile) {
               
                if(!empty($user->avatar)){
                    $oldPath = public_path($user->avatar);
                    if(file_exists($oldPath)){
                        @unlink($oldPath);
                    }
                }

                $extension = $data['avatar']->getClientOriginalExtension();
                $filename = 'user-' . time() . '.' . $extension;
    
                $destination = public_path('images/users');
    
                // crée le dossier s'il n'existe pas
                if (!file_exists($destination)) {
                    mkdir($destination, 0755, true);
                }
    
                $data['avatar']->move($destination, $filename);

                $payload['avatar'] = 'images/users/'. $filename;
            }
        }
        
        // rien à update ?
        if (empty($payload)) {
            throw ValidationException::withMessages([
                'user' => 'Aucune donnée à mettre à jour.',
            ]);
        }

        $updated = $this->userRepository->update($user, $payload);


        if(!$updated){
            throw ValidationException::withMessages([
                'user' => 'Mise à jour échouée.',
            ]);
        }

        if(array_key_exists('role', $data)){
            $updated->syncRoles($data['role']);
        }

        return $updated;
    }

    public function deleteUser(int|string $id): void
    {
        $user = $this->getUserById($id, ['id']);

        if(!$user) {
            throw ValidationException::withMessages([
                'user' => 'Utilisateur non trouvée.',
            ]);
        }

        $this->userRepository->delete($user);
    }

    public function restoreUser(int|string $id){

        $user = $this->getUserById(
            id: $id,
            fields: ['*'],
            onlyTrashed:true);
    
        if(!$user) {
            throw ValidationException::withMessages([
                'user' => 'Utilisateur non trouvée.',
            ]);
        }

        // cas: user trouvé mais pas supprimé
        if (!$user->trashed()) {
            throw ValidationException::withMessages([
                'user' => 'Utilisateur non supprimé (rien à restaurer).',
            ]);
        }

        $user = $this->userRepository->restore($id);

        // ⚠️ IMPORTANT : le restore() du repo restaure déjà, donc ici on recharge juste si besoin
        return $user->fresh(['roles']);
    }

    public function forceDeleteUser(int|string $id): void
    {
        // vérifier existence (même soft-deleted)
        $user = $this->getUserById(
            id: $id,
            withTrashed: true);

        if (!$user) {
            throw ValidationException::withMessages([
                'user' => 'Utilisateur non trouvé.',
            ]);
        }

        // (Optionnel) obliger à soft-delete avant force delete
        if (!$user->trashed()) {
            throw ValidationException::withMessages([
                'user' => 'Supprimez d’abord (soft delete) avant suppression définitive.',
            ]);
        }

        // ✅ Supprimer l'image avatar du disque (si existe)
        if (!empty($user->avatar)) {
            $avatarPath = public_path($user->avatar); // ex: images/users/xxx.png
            if (file_exists($avatarPath)) {
                @unlink($avatarPath);
            }
        }

        $this->userRepository->forceDelete((int) $id);
    }

}