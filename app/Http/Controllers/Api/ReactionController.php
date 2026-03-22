<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Reaction;
use App\Models\Student;
use App\Support\VisitorFingerprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReactionController extends Controller
{
    public function show(string $type, int $targetId, Request $request): JsonResponse
    {
        [$targetType, $targetModel] = $this->resolveTarget($type);

        if (! $targetModel::query()->whereKey($targetId)->exists()) {
            return response()->json([
                'message' => 'Target not found.',
            ], 404);
        }

        $visitorKey = VisitorFingerprint::fromRequest($request);
        $targetQuery = Reaction::query()->forTarget($targetType, $targetId);

        return response()->json([
            'type' => $targetType,
            'target_id' => $targetId,
            'total' => $targetQuery->count(),
            'reacted' => (clone $targetQuery)->where('visitor_key', $visitorKey)->exists(),
        ]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(Reaction::allowedTypes())],
            'target_id' => ['required', 'integer', 'min:1'],
        ]);

        [$targetType, $targetModel] = $this->resolveTarget($validated['type']);
        $targetId = (int) $validated['target_id'];

        if (! $targetModel::query()->whereKey($targetId)->exists()) {
            return response()->json([
                'message' => 'Target not found.',
            ], 404);
        }

        $visitorKey = VisitorFingerprint::fromRequest($request);
        $existingReaction = Reaction::query()
            ->forTarget($targetType, $targetId)
            ->where('visitor_key', $visitorKey)
            ->first();

        if ($existingReaction) {
            $existingReaction->delete();
            $reacted = false;
        } else {
            Reaction::query()->create([
                'target_type' => $targetType,
                'target_id' => $targetId,
                'visitor_key' => $visitorKey,
            ]);
            $reacted = true;
        }

        $total = Reaction::query()
            ->forTarget($targetType, $targetId)
            ->count();

        return response()->json([
            'type' => $targetType,
            'target_id' => $targetId,
            'total' => $total,
            'reacted' => $reacted,
        ]);
    }

    /**
     * @return array{string, class-string<\Illuminate\Database\Eloquent\Model>}
     */
    private function resolveTarget(string $type): array
    {
        return match ($type) {
            Reaction::TYPE_STUDENT => [Reaction::TYPE_STUDENT, Student::class],
            Reaction::TYPE_FACULTY => [Reaction::TYPE_FACULTY, Faculty::class],
            default => throw ValidationException::withMessages([
                'type' => 'Invalid reaction target type.',
            ]),
        };
    }
}
