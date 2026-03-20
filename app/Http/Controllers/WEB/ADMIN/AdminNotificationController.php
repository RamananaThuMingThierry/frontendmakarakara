<?php

namespace App\Http\Controllers\WEB\ADMIN;

use App\Http\Controllers\Controller;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function __construct(private readonly AdminNotificationService $adminNotificationService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = max(1, min(50, (int) $request->integer('per_page', 15)));
        $unreadOnly = $request->boolean('unread_only');

        $pager = $this->adminNotificationService->paginateForUser($user, $perPage, $unreadOnly)
            ->through(fn ($notification) => $this->formatNotification($notification));

        return response()->json([
            'data' => $pager,
            'meta' => [
                'unread_count' => $this->adminNotificationService->unreadCountForUser($user),
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = max(1, min(20, (int) $request->integer('limit', 6)));

        return response()->json([
            'data' => [
                'items' => $this->adminNotificationService
                    ->recentForUser($user, $limit)
                    ->map(fn ($notification) => $this->formatNotification($notification))
                    ->values(),
                'unread_count' => $this->adminNotificationService->unreadCountForUser($user),
            ],
        ]);
    }

    public function markAsRead(Request $request, int $notificationId): JsonResponse
    {
        $notification = $this->adminNotificationService->markAsReadForUser($request->user(), $notificationId);

        if (! $notification) {
            return response()->json([
                'message' => 'Notification introuvable.',
            ], 404);
        }

        return response()->json([
            'message' => 'Notification marquee comme lue.',
            'data' => $this->formatNotification($notification),
            'meta' => [
                'unread_count' => $this->adminNotificationService->unreadCountForUser($request->user()),
            ],
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $updated = $this->adminNotificationService->markAllAsReadForUser($request->user());

        return response()->json([
            'message' => 'Notifications marquees comme lues.',
            'data' => [
                'updated_count' => $updated,
            ],
            'meta' => [
                'unread_count' => 0,
            ],
        ]);
    }

    private function formatNotification($notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'category' => $notification->category,
            'title' => $notification->title,
            'message' => $notification->message,
            'severity' => $notification->severity,
            'entity_type' => $notification->entity_type,
            'entity_id' => $notification->entity_id,
            'action_url' => $notification->action_url,
            'metadata' => $notification->metadata,
            'is_read' => ! is_null($notification->read_at),
            'read_at' => optional($notification->read_at)->toIso8601String(),
            'created_at' => optional($notification->created_at)->toIso8601String(),
        ];
    }
}
