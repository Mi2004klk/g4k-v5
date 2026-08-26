<?php

namespace App\Observers;

use App\Models\Approval;

class ApprovalObserver
{
    /**
     * Handle the Approval "created" event.
     */
    public function created(Approval $approval): void
    {
        //
    }

    /**
     * Handle the Approval "updated" event.
     */
    public function updated(Approval $approval): void
    {
        //
    }

    /**
     * Handle the Approval "deleted" event.
     */
    public function deleted(Approval $approval): void
    {
        //
    }

    /**
     * Handle the Approval "restored" event.
     */
    public function restored(Approval $approval): void
    {
        //
    }

    /**
     * Handle the Approval "force deleted" event.
     */
    public function forceDeleted(Approval $approval): void
    {
        //
    }
}
