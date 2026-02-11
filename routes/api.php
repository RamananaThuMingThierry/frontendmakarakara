<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WEB\AuthController;
use App\Http\Controllers\WEB\CategoryController;
use App\Http\Controllers\WEB\ActivityLogController;
use App\Http\Controllers\WEB\BrandController;
use App\Http\Controllers\WEB\CityController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgot']);
Route::post('/reset-password', [AuthController::class, 'rest']);

Route::middleware('auth:sanctum')->group(function(){
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware(['role:admin'])->group(function () {
        // Route::get('/admin/dashboard', ...);
        Route::get('admin/account', function(Request $request){
            return response()->json($request->user());
        });
        
        Route::apiResource('/admin/categories', CategoryController::class);

        Route::apiResource('/admin/brand', BrandController::class);

        Route::apiResource('/admin/city', CityController::class);

        Route::apiResource('/admin/activity-logs', ActivityLogController::class)->only(['index','show','destroy']);
    });

    Route::middleware(['role:delivery'])->group(function () {
        // Route::get('/delivery/dashboard', ...);
    });

    Route::middleware(['role:customer'])->group(function () {
        // Route::get('/customer/account', ...);

        Route::get('/account', function(Request $request){
            return response()->json($request->user());
        });
    });
});
