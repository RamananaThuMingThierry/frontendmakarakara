<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'ramanananathumingthierry@gmail.com'],
            [
                'name' => 'RAMANANA Thu Ming Thierry',
                'phone' => '+261327563770',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        $user->syncRoles(['admin']);
    }
}
