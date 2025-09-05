import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

interface AnalyticsTabNavigationProps {
  tabs: Tab[];
}

const AnalyticsTabNavigation: React.FC<AnalyticsTabNavigationProps> = ({ tabs }) => {
  const pathname = usePathname();

  const isActiveTab = (href: string) => {
    if (href === '/analytics' && pathname === '/analytics') {
      return true;
    }
    if (href !== '/analytics' && pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  return (
    <div className="border-b border-gray-200 bg-white rounded-lg">
      <nav className="flex space-x-8 px-6 py-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.href);
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                group inline-flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className={`transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AnalyticsTabNavigation;
