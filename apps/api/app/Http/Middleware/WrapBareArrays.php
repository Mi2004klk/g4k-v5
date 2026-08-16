<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WrapBareArrays
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $data = $response->getData(true); // get as associative array
            
            // If the data is a sequential list (bare array) without 'data' key,
            // wrap it in a 'data' envelope to standardize the contract.
            if (is_array($data) && array_is_list($data)) {
                $response->setData(['data' => $data]);
            }
        }

        return $response;
    }
}
