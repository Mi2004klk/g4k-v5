"use client";

import { AppIcon } from "@g4k/ui/components";
import { Card, Button, Badge } from "@g4k/ui/components";

export function ProfileConnectedAccountsSection() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="externalLink" className="text-indigo-500 w-5 h-5" />
            Connected Accounts
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage third-party integrations and accounts.</p>
        </div>
        
        <div className="pl-0 sm:pl-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                <AppIcon name="users" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  YouTube Team
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md">
                    Connected
                  </Badge>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">g4kkarthik@gmail.com</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-5 h-10 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Manage Connection
            </Button>
            
          </div>
        </div>
      </Card>
    </div>
  );
}
