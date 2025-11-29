import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

interface ProfileLinksEditorProps {
  links: string[];
  onLinksChange: (links: string[]) => void;
  disabled?: boolean;
}

export default function ProfileLinksEditor({
  links,
  onLinksChange,
  disabled = false,
}: ProfileLinksEditorProps) {
  const [newLink, setNewLink] = useState('');

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      onLinksChange([...links, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    onLinksChange(updatedLinks);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLink();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base Links</CardTitle>
        <p className="text-sm text-gray-600">
          Add links to resources, documentation, or tools that you frequently
          reference when helping users.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new link */}
        <div className="flex gap-2">
          <Input
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/resource"
            disabled={disabled}
            className="flex-1"
          />
          <Button
            onClick={addLink}
            disabled={!newLink.trim() || disabled}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Links list */}
        {links.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Links</Label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={link}
                  onChange={e => updateLink(index, e.target.value)}
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLink(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No links added yet. Add your first knowledge base link above.
          </p>
        )}

        {/* Help text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Links should be publicly accessible URLs</p>
          <p>• These will be shared with users when you help them</p>
          <p>
            • Consider adding documentation, tutorials, or reference materials
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
