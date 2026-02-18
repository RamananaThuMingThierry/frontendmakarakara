<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        $userId = decrypt_to_int_or_null($this->route('user')); 

        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [

            // avatar upload
            'avatar' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png',
                'max:2048', // 2MB
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],

            // role unique
            'role' => [
                'required',
                Rule::in(['admin', 'delivery']),
            ],

            // password
            'password' => [
                $isUpdate ? 'nullable' : 'required',
                'confirmed',
                'min:6',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Name is required',
            'email.required' => 'Email is required',
            'email.unique' => 'Email already exists',
            'role.required' => 'Role is required',
            'password.required' => 'Password is required',
            'password.confirmed' => 'Password confirmation does not match',
            'avatar.image' => 'Avatar must be an image',
        ];
    }
}
