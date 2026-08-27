"use client";

import { useState, useEffect, useRef } from "react";
import { AppIcon } from "@g4k/ui/components";

// Existing Components (to be refactored)
import { ProfileHeader } from "./components/profile-header";
import { ProfileStats } from "./components/profile-stats";
import { ProfileGeneralSection } from "./components/profile-general";
import { ProfileSecuritySection } from "./components/profile-security";
import { ProfileNotificationSection } from "./components/profile-notification";
import { ProfileAccountSection } from "./components/profile-account";

// New Components
import { ProfileWorkAddressSection } from "./components/profile-work-address";
import { ProfileEmergencyContactSection } from "./components/profile-emergency-contact";
import { ProfilePrivacySection } from "./components/profile-privacy";
import { ProfileConnectedAccountsSection } from "./components/profile-connected-accounts";
import { ProfileWorkspaceSection } from "./components/profile-workspace-section";

const SECTIONS = [
  { id: "general", label: "General Info", icon: "profile" as const, color: "orange" },
  { id: "workspace", label: "Workspace & Roles", icon: "command" as const, color: "violet" },
  { id: "security", label: "Security & Devices", icon: "shield" as const, color: "blue" },
  { id: "preferences", label: "Preferences & Support", icon: "settings" as const, color: "slate" },
  { id: "notifications", label: "Notification Preferences", icon: "bell" as const, color: "indigo" },
  { id: "connected", label: "Connected Accounts", icon: "externalLink" as const, color: "emerald" },
  { id: "privacy", label: "Privacy Settings", icon: "shield" as const, color: "rose" },
];

const COLOR_VARIANTS: Record<string, { active: string, icon: string }> = {
  orange: {
    active: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-500 shadow-sm",
    icon: "text-orange-500",
  },
  violet: {
    active: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50 text-violet-600 dark:text-violet-500 shadow-sm",
    icon: "text-violet-500",
  },
  blue: {
    active: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-500 shadow-sm",
    icon: "text-blue-500",
  },
  slate: {
    active: "bg-slate-100 dark:bg-slate-800 border-slate-900 dark:border-slate-400 border-[1.5px] text-slate-800 dark:text-slate-200 shadow-sm",
    icon: "text-slate-600 dark:text-slate-400",
  },
  indigo: {
    active: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-500 shadow-sm",
    icon: "text-indigo-500",
  },
  emerald: {
    active: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 shadow-sm",
    icon: "text-emerald-500",
  },
  rose: {
    active: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-500 shadow-sm",
    icon: "text-rose-500",
  },
};

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("general");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainScrollContainer = document.getElementById("main-content");
    
    if (!mainScrollContainer) {
      console.warn("Could not find #main-content for scroll spy");
      return;
    }

    const handleScroll = () => {
      const sections = SECTIONS.map(s => document.getElementById(s.id));
      let currentActive = SECTIONS[0].id;
      let minDistance = Infinity;

      // Simple scroll spy logic
      sections.forEach(section => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        // The container header/breadcrumb takes some space, so we check near top
        const OFFSET = 120;
        
        if (rect.top >= 0 && rect.top < 300 + OFFSET) {
           currentActive = section.id;
        } else if (rect.top < 0 && Math.abs(rect.top - OFFSET) < minDistance) {
           minDistance = Math.abs(rect.top - OFFSET);
           currentActive = section.id;
        }
      });

      setActiveSection(currentActive);
    };

    mainScrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    // Call once to set initial
    handleScroll();
    
    return () => mainScrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const mainScrollContainer = document.getElementById("main-content");
    
    if (el && mainScrollContainer) {
      // Calculate position relative to the scroll container
      const containerRect = mainScrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop = mainScrollContainer.scrollTop;
      
      const y = elRect.top + scrollTop - containerRect.top - 24; // 24px padding
      
      mainScrollContainer.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-6 page-padding max-w-[1200px] mx-auto font-sans w-full pb-32">
      {/* Main Settings Area: Sidebar + Stacked Content */}
      <div className="flex flex-col md:flex-row gap-8 items-start mt-4 relative">
        
        {/* Left Sidebar (Sticky) */}
        <nav className="flex flex-col w-full md:w-[240px] shrink-0 bg-transparent h-auto p-0 space-y-1 sticky top-0 md:top-6">
          <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-3">
            Profile Settings
          </div>
          
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const styles = COLOR_VARIANTS[section.color] || COLOR_VARIANTS.orange;
            
            return (
              <button 
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex w-full items-center justify-start gap-3 px-3 py-2.5 h-11 rounded-[14px] border text-sm font-medium transition-all ${
                  isActive 
                    ? styles.active 
                    : "border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                }`}
              >
                <AppIcon name={section.icon} className={`w-4 h-4 ${isActive ? styles.icon : 'text-neutral-400'}`} /> 
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Right Content Area (Scrollable Sections) */}
        <div ref={contentRef} className="flex-1 min-w-0 w-full flex flex-col gap-6">
          {/* Header & Stats (Top of right content) */}
          <div className="flex flex-col gap-6 w-full">
            <ProfileHeader />
            <ProfileStats />
          </div>

          <div id="general" className="scroll-mt-24">
            <ProfileGeneralSection />
          </div>

          <div id="workspace" className="scroll-mt-24">
            <ProfileWorkspaceSection />
          </div>

          <div id="security" className="scroll-mt-24 flex flex-col gap-6">
            <ProfileSecuritySection />
            <ProfileWorkAddressSection />
            <ProfileEmergencyContactSection />
          </div>
          
          <div id="privacy" className="scroll-mt-24">
            <ProfilePrivacySection />
          </div>

          <div id="notifications" className="scroll-mt-24">
            <ProfileNotificationSection />
          </div>

          <div id="connected" className="scroll-mt-24">
            <ProfileConnectedAccountsSection />
          </div>
          
          <div id="preferences" className="scroll-mt-24">
            <ProfileAccountSection />
          </div>
        </div>
      </div>
    </div>
  );
}
