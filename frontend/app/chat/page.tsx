'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SideRail, RailTab } from '../../components/layout/SideRail';
import { ConversationPanel } from '../../components/conversations/ConversationPanel';
import { ChatPane } from '../../components/chat/ChatPane';
import { NewChatModal } from '../../components/conversations/NewChatModal';
import { NewGroupModal } from '../../components/conversations/NewGroupModal';
import { GroupDetailsModal } from '../../components/groups/GroupDetailsModal';
import { CallsPlaceholder } from '../../components/placeholders/CallsPlaceholder';
import { StoriesPlaceholder } from '../../components/placeholders/StoriesPlaceholder';
import { SettingsPlaceholder } from '../../components/placeholders/SettingsPlaceholder';

import { useAuth } from '../../hooks/useAuth';
import { useConversations } from '../../hooks/useConversations';
import { Conversation } from '../../types/conversation';

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<RailTab>('chats');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  const {
    conversations,
    isLoading: isConvLoading,
    refreshConversations,
    markConversationRead,
  } = useConversations(activeConversation?.id);

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Select first conversation by default if available and none selected
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    markConversationRead(conv.id);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-signal-dark text-white">
        <div className="animate-pulse font-semibold text-sm">Initializing Signal Session...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-signal-light dark:bg-signal-dark">
      {/* Pane 1: SideRail */}
      <SideRail
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container based on active tab */}
      {activeTab === 'chats' && (
        <>
          {/* Pane 2: Conversation Panel */}
          <ConversationPanel
            conversations={conversations}
            activeConversation={activeConversation}
            currentUser={user}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
          />

          {/* Pane 3: Chat Pane */}
          <ChatPane
            conversation={activeConversation}
            currentUser={user}
            onOpenGroupDetails={() => setIsGroupDetailsOpen(true)}
          />
        </>
      )}

      {activeTab === 'calls' && <CallsPlaceholder />}
      {activeTab === 'stories' && <StoriesPlaceholder />}
      {activeTab === 'settings' && <SettingsPlaceholder user={user} />}

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      <GroupDetailsModal
        isOpen={isGroupDetailsOpen}
        onClose={() => setIsGroupDetailsOpen(false)}
        conversation={activeConversation}
        currentUser={user}
        onRefreshConversation={refreshConversations}
      />
    </div>
  );
}
