<?php

namespace App\Presenters;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\CursorPaginator;

class UserPresenter
{
    /**
     * Centralized field-hiding applied to user serialization paths.
     * Prevents PII leaks in per-record views and directory.
     *
     * @param mixed $data
     * @param Request $request
     * @return mixed
     */
    public static function applyPrivacyFilter($data, Request $request)
    {
        $requestUser = $request->user();

        if ($data instanceof User) {
            self::hideFields($data, $requestUser);
        } elseif ($data instanceof Collection) {
            $data->each(fn($item) => self::hideFields($item, $requestUser));
        } elseif ($data instanceof LengthAwarePaginator || $data instanceof CursorPaginator) {
            $data->getCollection()->each(fn($item) => self::hideFields($item, $requestUser));
        }

        return $data;
    }

    private static function hideFields($user, $requestUser)
    {
        if (!$user instanceof User) {
            return;
        }

        $isSelf = $requestUser && (int) $requestUser->id === (int) $user->id;

        if (!$isSelf) {
            $user->makeHidden([
                'blood_group',
                'emergency_contact',
                'alternate_mobile',
                'preferences',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relation'
            ]);
        }
    }
}
