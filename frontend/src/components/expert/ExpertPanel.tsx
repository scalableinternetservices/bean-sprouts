import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ExpertProfile, ExpertQueue } from '@/types';

interface ExpertPanelProps {
  expertProfile: ExpertProfile | null;
  expertQueue: ExpertQueue | null;
  onUpdateProfile: (profile: Partial<ExpertProfile>) => void;
  onClaimConversation: (conversationId: string) => void;
  onUnclaimConversation: (conversationId: string) => void;
  onResolveConversation: (conversationId: string) => void;
}

export default function ExpertPanel({
  expertProfile,
  expertQueue,
  onUpdateProfile,
  onClaimConversation: _onClaimConversation,
  onUnclaimConversation: _onUnclaimConversation,
  onResolveConversation: _onResolveConversation,
}: ExpertPanelProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedBio, setEditedBio] = useState(expertProfile?.bio || '');
  const [editedLinks, setEditedLinks] = useState(
    expertProfile?.knowledgeBaseLinks.join('\n') || ''
  );

  const waitingConversations = expertQueue?.waitingConversations;

  const assignedConversations = expertQueue?.assignedConversations;

  const handleSaveProfile = () => {
    const updatedProfile: Partial<ExpertProfile> = {
      bio: editedBio,
      knowledgeBaseLinks: editedLinks.split('\n').filter(link => link.trim()),
    };
    onUpdateProfile(updatedProfile);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setEditedBio(expertProfile?.bio || '');
    setEditedLinks(expertProfile?.knowledgeBaseLinks.join('\n') || '');
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6">
      {/* Expert Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expert Profile</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
            >
              {isEditingProfile ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!expertProfile ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load profile</p>
            </div>
          ) : isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editedBio}
                  onChange={e => setEditedBio(e.target.value)}
                  placeholder="Describe your expertise and background..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="links">Knowledge Base Links</Label>
                <Textarea
                  id="links"
                  value={editedLinks}
                  onChange={e => setEditedLinks(e.target.value)}
                  placeholder="Enter one link per line..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter one URL per line. These will be shared with users when
                  you help them.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Bio</Label>
                <p className="text-sm text-gray-600 mt-1 text-left pl-4">
                  {expertProfile.bio || 'No bio provided'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Knowledge Base Links
                </Label>
                {expertProfile.knowledgeBaseLinks.length > 0 ? (
                  <ul className="text-sm text-gray-600 mt-1 space-y-1 text-left pl-4">
                    {expertProfile.knowledgeBaseLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1 text">
                    No links provided
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {waitingConversations?.length}
              </div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assignedConversations?.length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Scroll to unclaimed conversations
                const unclaimedSection = document.getElementById(
                  'unclaimed-conversations'
                );
                unclaimedSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Unclaimed Conversations ({waitingConversations?.length})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Scroll to active conversations
                const activeSection = document.getElementById(
                  'active-conversations'
                );
                activeSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View My Active Conversations ({assignedConversations?.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
