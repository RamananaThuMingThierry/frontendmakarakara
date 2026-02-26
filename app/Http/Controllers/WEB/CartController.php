<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\CartService;
use Illuminate\Http\Request;
use Throwable;

class CartController extends Controller
{
    public function __construct(private CartService $cartService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{
            $constraints = [];

            $carts = $this->cartService->getAllCarts(
                array_keys($constraints),
                array_values($constraints)
            );

            return response()->json([
                'data' => $carts
            ]);
            
        }catch(Throwable $e){

        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
