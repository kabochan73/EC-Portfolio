<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class EmailVerificationController extends Controller
{
    /**
     * GET /api/email/verify/{id}/{hash} … 署名付き URL（signed:relative）。
     * BFF が /verify-email 着地時にクエリを組み立てて中継する（docs/03 / docs/08 §4）。
     */
    public function verify(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::find($id);

        if ($user === null || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            throw new AccessDeniedHttpException('Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(status: 204);
        }

        $user->markEmailAsVerified();

        return response()->json(status: 204);
    }

    /**
     * POST /api/email/verification-notification … 現在のユーザーへ検証メールを再送。
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(status: 204);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => '確認メールを送信しました。'], 202);
    }
}
