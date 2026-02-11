'use client';

type TabNavigationProps = {
  activeTab: 'metronome' | 'tuner';
  onTabChange: (tab: 'metronome' | 'tuner') => void;
};

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="w-full bg-gray-900 border-b border-gray-800">
      <div className="flex">
        <button
          onClick={() => onTabChange('metronome')}
          className={`flex-1 min-h-12 px-4 py-3 text-center font-medium transition-colors ${
            activeTab === 'metronome'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-gray-200'
          }`}
        >
          메트로놈
        </button>
        <button
          onClick={() => onTabChange('tuner')}
          className={`flex-1 min-h-12 px-4 py-3 text-center font-medium transition-colors ${
            activeTab === 'tuner'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-gray-200'
          }`}
        >
          튜너
        </button>
      </div>
    </nav>
  );
}
