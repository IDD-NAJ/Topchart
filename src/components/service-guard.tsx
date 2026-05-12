"use client";

import { useServiceStatus, type ServiceKey } from "@/hooks/use-service-status";
import { ComingSoonOverlay } from "@/components/coming-soon-badge";
import { Wrench } from "lucide-react";

interface ServiceGuardProps {
  serviceKey: ServiceKey;
  children: React.ReactNode;
}

export function ServiceGuard({ serviceKey, children }: ServiceGuardProps) {
  const { isEnabled, isComingSoon, getComingSoonMessage, getExpectedLaunchDate, isMaintenance, getMaintenanceMessage, isLoading } = useServiceStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isEnabled(serviceKey)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
          <Wrench className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Service Unavailable</h2>
        <p className="text-muted-foreground max-w-md">
          This service is currently unavailable. Please check back later or contact support.
        </p>
      </div>
    );
  }

  if (isMaintenance(serviceKey)) {
    const message = getMaintenanceMessage(serviceKey);
    return (
      <div className="relative group">
        <div className="pointer-events-none select-none opacity-20 blur-[2px]" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center p-4 transition-opacity">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow-lg">
            <Wrench className="w-5 h-5" />
            Under Maintenance
          </div>
          {message && (
            <p className="mt-3 text-center text-sm text-muted-foreground max-w-[300px]">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isComingSoon(serviceKey)) {
    const message = getComingSoonMessage(serviceKey);
    const expectedDate = getExpectedLaunchDate(serviceKey);
    return (
      <ComingSoonOverlay message={message} expectedDate={expectedDate}>
        {children}
      </ComingSoonOverlay>
    );
  }

  return <>{children}</>;
}
