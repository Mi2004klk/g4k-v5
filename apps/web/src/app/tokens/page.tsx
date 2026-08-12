import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tokens QA",
  description: "Visual QA for Design System Tokens",
};

export default function TokensPage() {
  const brandTokens = [
    { name: "Primary", var: "bg-primary", text: "text-primary-foreground" },
    { name: "Violet", var: "bg-accent-violet", text: "text-white" },
    { name: "Violet Deep", var: "bg-accent-violet-deep", text: "text-white" },
    { name: "Gold", var: "bg-accent-gold", text: "text-black" },
    { name: "Pink", var: "bg-accent-pink", text: "text-white" },
    { name: "Orange", var: "bg-accent-orange", text: "text-white" },
    { name: "Coral", var: "bg-accent-coral", text: "text-white" },
    { name: "Red", var: "bg-accent-red", text: "text-white" },
    { name: "Magenta", var: "bg-accent-magenta", text: "text-white" },
    { name: "Blue", var: "bg-accent-blue", text: "text-white" },
    { name: "Indigo", var: "bg-accent-indigo", text: "text-white" },
    { name: "Cyan", var: "bg-accent-cyan", text: "text-white" },
    { name: "Teal", var: "bg-accent-teal", text: "text-white" },
    { name: "Green", var: "bg-accent-green", text: "text-white" },
    { name: "Lime", var: "bg-accent-lime", text: "text-black" },
    { name: "Gray", var: "bg-accent-gray", text: "text-white" },
  ];

  const semanticTokens = [
    { name: "Success", var: "bg-success", text: "text-white" },
    { name: "Info", var: "bg-info", text: "text-white" },
    { name: "Warning", var: "bg-warning", text: "text-black" },
    { name: "Danger (Destructive)", var: "bg-danger", text: "text-white" },
    { name: "Neutral Status", var: "bg-neutral-status", text: "text-black" },
    { name: "Overtime", var: "bg-overtime", text: "text-white" },
  ];

  const surfaceTokens = [
    { name: "Background", var: "bg-background", text: "text-foreground" },
    { name: "Surface (Card)", var: "bg-surface", text: "text-foreground" },
    { name: "Surface 2 (Secondary)", var: "bg-surface-2", text: "text-secondary-foreground" },
    { name: "Popover", var: "bg-popover", text: "text-popover-foreground" },
  ];
  
  const borderTokens = [
    { name: "Border", var: "border-border" },
    { name: "Border Strong", var: "border-border-strong" },
    { name: "Input", var: "border-input" },
    { name: "Ring", var: "border-ring" },
  ];

  return (
    <div className="container py-10 space-y-12">
      <div>
        <h1 className="text-display text-4xl font-bold tracking-tight">Design System Tokens</h1>
        <p className="text-secondary mt-2">Visual QA page to ensure all variables render correctly in light and dark modes.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Brand Accents</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {brandTokens.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div className={`h-16 w-full rounded-md shadow-sm flex items-center justify-center ${token.var} ${token.text}`}>
                <span className="text-xs font-medium px-2 text-center leading-tight">Aa</span>
              </div>
              <span className="text-xs text-secondary-foreground">{token.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Semantic Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {semanticTokens.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div className={`h-16 w-full rounded-md shadow-sm flex items-center justify-center ${token.var} ${token.text}`}>
                <span className="text-xs font-medium px-2 text-center leading-tight">Aa</span>
              </div>
              <span className="text-xs text-secondary-foreground">{token.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Surfaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {surfaceTokens.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div className={`h-24 w-full rounded-md border border-border shadow-e1 flex items-center justify-center ${token.var} ${token.text}`}>
                <span className="text-sm font-medium">{token.name}</span>
              </div>
              <span className="text-xs text-secondary-foreground">{token.var}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Borders</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {borderTokens.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div className={`h-16 w-full rounded-md bg-surface border-2 flex items-center justify-center ${token.var}`}>
                <span className="text-xs font-medium text-foreground">Border</span>
              </div>
              <span className="text-xs text-secondary-foreground">{token.name}</span>
            </div>
          ))}
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Gradients (Tailwind v4)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gradients.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div className={`h-24 w-full rounded-md shadow-sm flex items-center justify-center ${token.var} text-white`}>
                <span className="text-sm font-medium">{token.name}</span>
              </div>
              <span className="text-xs text-secondary-foreground">{token.var}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
