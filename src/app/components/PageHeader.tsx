'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  filterElement?: React.ReactNode;
  actionElement?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  filterElement,
  actionElement,
  icon,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#191919]/80 backdrop-blur-md border-b border-white/5 px-4 py-4 md:px-6 -mx-4 md:-mx-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Title & Subtitle */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-blue-500/10 rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Filter & Actions */}
        {(filterElement || actionElement) && (
          <div className="flex items-center gap-3 flex-wrap">
            {filterElement && (
              <div className="flex items-center gap-2">
                {filterElement}
              </div>
            )}
            {actionElement && (
              <div className="flex items-center gap-2">
                {actionElement}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
