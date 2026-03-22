<?php

namespace App\Support;

use Illuminate\Http\Request;

class VisitorFingerprint
{
    public static function fromRequest(Request $request): string
    {
        $ipAddress = $request->ip() ?? 'unknown-ip';
        $userAgent = $request->userAgent() ?? 'unknown-user-agent';

        return hash('sha256', $ipAddress.'|'.$userAgent);
    }
}
