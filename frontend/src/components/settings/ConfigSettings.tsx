import { useState } from 'react';
import { useConfig } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ConfigSettings() {
  const {
    config,
    updateConfig,
    resetConfig,
    validateConfig,
    getAvailableOptions,
    isLoading,
    error,
    clearError,
  } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const availableOptions = getAvailableOptions();

  const handleConfigChange = (
    field: keyof typeof config,
    value: string | number
  ) => {
    const updatedConfig = { ...localConfig, [field]: value };
    setLocalConfig(updatedConfig);

    // Validate the updated configuration
    const validation = validateConfig(updatedConfig);
    setValidationErrors(validation.errors);
  };

  const handleSave = () => {
    const validation = validateConfig(localConfig);
    if (validation.isValid) {
      updateConfig(localConfig);
      setValidationErrors([]);
    } else {
      setValidationErrors(validation.errors);
    }
  };

  const handleReset = () => {
    setLocalConfig(availableOptions.defaultConfig);
    setValidationErrors([]);
    resetConfig();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configuration Settings</CardTitle>
        <p className="text-sm text-gray-600">
          Configure backend mode, update service, and connection settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p className="font-medium">Configuration Validation Errors:</p>
            <ul className="list-disc list-inside mt-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Backend Mode */}
        <div className="space-y-2">
          <Label htmlFor="backendMode">Backend Mode</Label>
          <select
            id="backendMode"
            value={localConfig.backendMode}
            onChange={e => handleConfigChange('backendMode', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {availableOptions.backendModes.map(mode => (
              <option key={mode} value={mode}>
                {mode === 'dummy' ? 'Dummy (Mock Data)' : 'API (Real Backend)'}
              </option>
            ))}
          </select>
        </div>

        {/* Update Mode */}
        <div className="space-y-2">
          <Label htmlFor="updateMode">Update Mode</Label>
          <select
            id="updateMode"
            value={localConfig.updateMode}
            onChange={e => handleConfigChange('updateMode', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {availableOptions.updateModes.map(mode => (
              <option key={mode} value={mode}>
                {mode === 'polling'
                  ? 'Polling'
                  : mode === 'sse'
                    ? 'Server-Sent Events'
                    : mode === 'websocket'
                      ? 'WebSocket'
                      : 'Push Notifications'}
              </option>
            ))}
          </select>
        </div>

        {/* API Base URL */}
        <div className="space-y-2">
          <Label htmlFor="apiBaseUrl">API Base URL</Label>
          <Input
            id="apiBaseUrl"
            type="url"
            value={localConfig.apiBaseUrl || ''}
            onChange={e => handleConfigChange('apiBaseUrl', e.target.value)}
            placeholder="https://api.example.com"
            disabled={localConfig.backendMode === 'dummy'}
          />
          {localConfig.backendMode === 'dummy' && (
            <p className="text-xs text-gray-500">Not used in dummy mode</p>
          )}
        </div>

        {/* WebSocket Base URL */}
        <div className="space-y-2">
          <Label htmlFor="wsBaseUrl">WebSocket Base URL</Label>
          <Input
            id="wsBaseUrl"
            type="url"
            value={localConfig.wsBaseUrl || ''}
            onChange={e => handleConfigChange('wsBaseUrl', e.target.value)}
            placeholder="wss://ws.example.com"
            disabled={localConfig.updateMode !== 'websocket'}
          />
          {localConfig.updateMode !== 'websocket' && (
            <p className="text-xs text-gray-500">
              Only used with WebSocket update mode
            </p>
          )}
        </div>

        {/* Polling Interval */}
        <div className="space-y-2">
          <Label htmlFor="pollingInterval">Polling Interval (ms)</Label>
          <Input
            id="pollingInterval"
            type="number"
            min="1000"
            value={localConfig.pollingInterval || ''}
            onChange={e =>
              handleConfigChange(
                'pollingInterval',
                parseInt(e.target.value) || 5000
              )
            }
            placeholder="5000"
            disabled={localConfig.updateMode !== 'polling'}
          />
          {localConfig.updateMode !== 'polling' && (
            <p className="text-xs text-gray-500">
              Only used with polling update mode
            </p>
          )}
        </div>

        {/* Max Reconnect Attempts */}
        <div className="space-y-2">
          <Label htmlFor="maxReconnectAttempts">Max Reconnect Attempts</Label>
          <Input
            id="maxReconnectAttempts"
            type="number"
            min="1"
            value={localConfig.maxReconnectAttempts || ''}
            onChange={e =>
              handleConfigChange(
                'maxReconnectAttempts',
                parseInt(e.target.value) || 5
              )
            }
            placeholder="5"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading || validationErrors.length > 0}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset to Defaults
          </Button>
        </div>

        {/* Current Configuration Display */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <pre className="whitespace-pre-wrap text-left">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
