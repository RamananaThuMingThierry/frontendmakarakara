<?php

namespace App\Providers;

use App\Interface\UserInterface;
use App\Interface\CategoryInterface;
use App\Repositories\UserRepository;
use App\Interface\ActivityLogInterface;
use App\Interface\BrandInterface;
use Illuminate\Support\ServiceProvider;
use App\Repositories\CategoryRepository;
use App\Repositories\ActivityLogRepository;
use App\Interface\PasswordResetCodeInterface;
use App\Repositories\BrandRepository;
use App\Repositories\PasswordResetCodeRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserInterface::class, UserRepository::class);
        $this->app->bind(PasswordResetCodeInterface::class, PasswordResetCodeRepository::class);
        $this->app->bind(CategoryInterface::class, CategoryRepository::class);
        $this->app->bind(ActivityLogInterface::class, ActivityLogRepository::class);
        $this->app->bind(BrandInterface::class, BrandRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
