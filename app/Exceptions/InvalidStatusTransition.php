<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * A requested lifecycle change is not permitted from the current state. Rendered as 409.
 */
class InvalidStatusTransition extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
