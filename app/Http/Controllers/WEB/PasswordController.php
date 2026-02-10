<?php

namespace App\Http\Controllers;

use App\Services\PassswordResetService;
use Illuminate\Http\Request;

class PasswordController extends Controller
{
    public function __construct(private PassswordResetService $reset) {}

    public function showForgot()
    {
        return view('auth.forgot-password');
    }

    public function sendCode(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $this->reset->sendResetCode($data['email']);

        // message neutre
        return redirect()->route('password.reset.form')
            ->with('status', "Si l'email existe, un code a été envoyé.");
    }

    public function showReset()
    {
        return view('auth.reset-password');
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $this->reset->resetPassword($data['email'], $data['code'], $data['password']);

        return redirect()->route('login')->with('status', 'Mot de passe réinitialisé. Connectez-vous.');
    }
}
