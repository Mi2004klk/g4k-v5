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

const SECTIONS = [
  { id: "general", label: "General Info", icon: "profile" as const },
  { id: "security", label: "Security & Devices", icon: "shield" as const },
  { id: "preferences", label: "Preferences & Support", icon: "settings" as const },
  { id: "notifications", label: "Notification Preferences", icon: "bell" as const },
  { id: "connected", label: "Connected Accounts", icon: "externalLink" as const },
  { id: "privacy", label: "Privacy Settings", icon: "shield" as const },
];

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("general");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = SECTIONS.map(s => document.getElementById(s.id));
      let currentActive = SECTIONS[0].id;
      let minDistance = Infinity;

      // Simple scroll spy logic
      sections.forEach(section => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        // Check which section is closest to the top of the viewport (with an offset)
        if (rect.top >= 0 && rect.top < 300) {
           currentActive = section.id;
        } else if (rect.top < 0 && Math.abs(rect.top) < minDistance) {
           minDistance = Math.abs(rect.top);
           currentActive = section.id;
        }
      });

      setActiveSection(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-6 page-padding max-w-[1200px] mx-auto font-sans w-full pb-32">
      {/* Main Settings Area: Sidebar + Stacked Content */}
      <div className="flex flex-col md:flex-row gap-8 items-start mt-4">
        
        {/* Left Sidebar (Sticky) */}
        <nav className="flex flex-col w-full md:w-[240px] shrink-0 bg-transparent h-auto p-0 space-y-1 sticky top-24">
          <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-3">
            Profile Settings
          </div>
          
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button 
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex w-full items-center justify-start gap-3 px-3 py-2.5 h-10 rounded-lg border text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-500 shadow-sm" 
                    : "border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                }`}
              >
                <AppIcon name={section.icon} className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-neutral-400'}`} /> 
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
