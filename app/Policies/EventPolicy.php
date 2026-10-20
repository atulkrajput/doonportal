<?php

namespace App\Policies;

use App\Enums\EventStatus;
use App\Enums\PermissionName;
use App\Models\Admin;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function viewAny(User|Admin|null $user): bool
    {
        return true;
    }

    public function view(User|Admin|null $user, Event $event): bool
    {
        return $event->isPublic()
            || ($user && ($user->hasPermission(PermissionName::ManageEvents) || ($user instanceof User && $event->submitted_by === $user->id)));
    }

    public function create(User|Admin $user): bool
    {
        return $user->hasPermission(PermissionName::ManageEvents);
    }

    /**
     * Submitters may edit their own events until they are published.
     */
    public function update(User|Admin $user, Event $event): bool
    {
        if ($user->hasPermission(PermissionName::ManageEvents)) {
            return true;
        }

        return ($user instanceof User && $event->submitted_by === $user->id)
            && in_array($event->status, [EventStatus::Draft, EventStatus::Submitted], true);
    }

    public function changeStatus(User|Admin $user, Event $event): bool
    {
        return $user->hasPermission(PermissionName::ManageEvents);
    }

    public function delete(User|Admin $user, Event $event): bool
    {
        return $user->hasPermission(PermissionName::ManageEvents);
    }

    public function forceDelete(User|Admin $user, Event $event): bool
    {
        return false;
    }
}
