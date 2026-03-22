<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Reaction;
use App\Models\Student;
use App\Models\YearbookComment;
use App\Support\VisitorFingerprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    private const ANONYMOUS_ADJECTIVES = [
        'Amber',
        'Azure',
        'Brave',
        'Bright',
        'Calm',
        'Clever',
        'Coral',
        'Crimson',
        'Emerald',
        'Golden',
        'Ivory',
        'Jade',
        'Lucky',
        'Mellow',
        'Nimble',
        'Radiant',
        'Silver',
        'Sunny',
        'Swift',
        'Velvet',
    ];

    private const ANONYMOUS_NOUNS = [
        'Aurora',
        'Badger',
        'Comet',
        'Dolphin',
        'Falcon',
        'Firefly',
        'Fox',
        'Hawk',
        'Heron',
        'Koala',
        'Lark',
        'Lynx',
        'Maple',
        'Otter',
        'Panda',
        'Robin',
        'Sparrow',
        'Tiger',
        'Willow',
        'Wolf',
    ];

    public function index(string $type, int $targetId): JsonResponse
    {
        [$targetType, $targetModel] = $this->resolveTarget($type);

        if (! $targetModel::query()->whereKey($targetId)->exists()) {
            return response()->json([
                'message' => 'Target not found.',
            ], 404);
        }

        $comments = YearbookComment::query()
            ->where('target_type', $targetType)
            ->where('target_id', $targetId)
            ->latest()
            ->limit(120)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (YearbookComment $comment) => $this->formatComment($comment));

        return response()->json([
            'type' => $targetType,
            'target_id' => $targetId,
            'comments' => $comments,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(YearbookComment::allowedTypes())],
            'target_id' => ['required', 'integer', 'min:1'],
            'name' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        [$targetType, $targetModel] = $this->resolveTarget($validated['type']);
        $targetId = (int) $validated['target_id'];

        if (! $targetModel::query()->whereKey($targetId)->exists()) {
            return response()->json([
                'message' => 'Target not found.',
            ], 404);
        }

        $visitorKey = VisitorFingerprint::fromRequest($request);
        $isPostingTooFast = YearbookComment::query()
            ->where('target_type', $targetType)
            ->where('target_id', $targetId)
            ->where('visitor_key', $visitorKey)
            ->where('created_at', '>=', now()->subSeconds(8))
            ->exists();

        if ($isPostingTooFast) {
            return response()->json([
                'message' => 'Please wait a few seconds before posting another comment.',
            ], 429);
        }

        $name = $this->resolveCommentName($validated['name'] ?? null, $visitorKey);
        $message = trim((string) $validated['message']);

        $comment = YearbookComment::query()->create([
            'target_type' => $targetType,
            'target_id' => $targetId,
            'name' => $name,
            'message' => $message,
            'visitor_key' => $visitorKey,
        ]);

        return response()->json([
            'message' => 'Comment posted.',
            'comment' => $this->formatComment($comment),
        ], 201);
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
                'type' => 'Invalid comment target type.',
            ]),
        };
    }

    /**
     * @return array{id: int, name: string, message: string, created_at: string}
     */
    private function formatComment(YearbookComment $comment): array
    {
        $storedName = trim((string) ($comment->name ?? ''));

        return [
            'id' => $comment->id,
            'name' => $this->shouldGenerateAnonymousAlias($storedName)
                ? $this->generateAnonymousAlias($comment->visitor_key ?? (string) $comment->id)
                : $storedName,
            'message' => $comment->message,
            'created_at' => $comment->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }

    private function resolveCommentName(?string $name, string $visitorKey): string
    {
        $trimmedName = trim((string) $name);

        if (! $this->shouldGenerateAnonymousAlias($trimmedName)) {
            return $trimmedName;
        }

        return $this->generateAnonymousAlias($visitorKey);
    }

    private function shouldGenerateAnonymousAlias(string $name): bool
    {
        return $name === '' || strcasecmp($name, 'anonymous') === 0;
    }

    private function generateAnonymousAlias(string $seed): string
    {
        $adjective = self::ANONYMOUS_ADJECTIVES[$this->stableIndex($seed.'|adj', count(self::ANONYMOUS_ADJECTIVES))];
        $noun = self::ANONYMOUS_NOUNS[$this->stableIndex($seed.'|noun', count(self::ANONYMOUS_NOUNS))];

        return "Anonymous {$adjective} {$noun}";
    }

    private function stableIndex(string $seed, int $count): int
    {
        $hash = hash('sha256', $seed);
        $segment = substr($hash, 0, 8);

        return ((int) hexdec($segment)) % max($count, 1);
    }
}
