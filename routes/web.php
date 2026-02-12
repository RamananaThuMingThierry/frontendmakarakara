<?php

use Illuminate\Support\Facades\Route;

Route::view('/{any}', 'website')->where('any', '^(?!admin).*$');

Route::view('/admin/{any?}', 'admin')->where('any', '.*');


