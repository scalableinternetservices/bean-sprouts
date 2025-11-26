import { ConfigSettings } from '@/components/settings';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center">
          <ConfigSettings />
        </div>
      </div>
    </div>
  );
}
