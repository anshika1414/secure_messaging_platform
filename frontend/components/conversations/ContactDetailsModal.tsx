import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Video,
  Phone,
  Bell,
  BellOff,
  Search,
  Clock,
  Edit3,
  Palette,
  ShieldCheck,
  Users,
  Plus,
  Ban,
  Check,
  ChevronRight,
  QrCode,
  Loader2,
} from 'lucide-react';
import { Conversation } from '../../types/conversation';
import { User } from '../../types/user';
import { Avatar } from '../common/Avatar';
import { conversationsApi } from '../../services/api/conversations';
import { Toast } from '../common/Toast';

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  currentUser: User | null;
  onRefreshConversations?: () => void;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onRefreshConversations,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [disappearingMode, setDisappearingMode] = useState<'Off' | '24h' | '7d' | '30d'>('Off');
  const [showDisappearingDropdown, setShowDisappearingDropdown] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [chatColor, setChatColor] = useState('#2563eb');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group add state
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [myGroupConversations, setMyGroupConversations] = useState<Conversation[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isAddingToGroup, setIsAddingToGroup] = useState(false);

  if (!isOpen || !conversation || conversation.type !== 'DIRECT') return null;

  const peer = conversation.members?.find((m) => m.user_id !== currentUser?.id)?.user;
  const peerName = nickname.trim() || peer?.display_name || 'Contact';
  const peerUsername = peer?.username ? `@${peer.username}` : peer?.phone || '';
  const isOnline = peer?.is_online || false;

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    setToastMessage(!isMuted ? `Muted notifications for ${peerName}` : `Unmuted notifications for ${peerName}`);
  };

  const handleToggleBlock = () => {
    setIsBlocked(!isBlocked);
    setToastMessage(!isBlocked ? `Blocked ${peerName}` : `Unblocked ${peerName}`);
  };

  const handleOpenAddToGroup = async () => {
    setShowAddToGroup(true);
    try {
      const allConvs = await conversationsApi.getConversations();
      const groups = allConvs.filter((c) => c.type === 'GROUP');
      setMyGroupConversations(groups);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUserToSelectedGroup = async () => {
    if (!selectedGroupId || !peer) return;
    setIsAddingToGroup(true);
    try {
      await conversationsApi.addGroupMember(selectedGroupId, peer.id);
      setToastMessage(`Added ${peerName} to group successfully!`);
      setShowAddToGroup(false);
      if (onRefreshConversations) onRefreshConversations();
    } catch (e: any) {
      setToastMessage(e.message || 'Failed to add member to group.');
    } finally {
      setIsAddingToGroup(false);
    }
  };

  const colors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {toastMessage && (
        <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
      )}

      <div className="w-full max-w-md bg-white dark:bg-signal-dark-panel rounded-3xl shadow-2xl border border-gray-200 dark:border-signal-dark-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-signal-dark-border shrink-0">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contact Info</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main User Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <Avatar
                name={peerName}
                url={peer?.avatar_url}
                size="xl"
                isOnline={isOnline}
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
              {peerName}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{peerUsername}</p>
            <p className="text-[11px] font-medium text-signal-blue mt-1">
              {isOnline ? 'Active Now' : 'Offline'}
            </p>
          </div>

          {/* Quick Action Buttons Row (Video, Audio, Mute, Search) */}
          <div className="grid grid-cols-4 gap-3 py-1">
            <button
              onClick={() => setToastMessage('Starting Video Call...')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-100 dark:bg-signal-dark-surface hover:bg-gray-200 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200"
            >
              <Video className="w-5 h-5 mb-1 text-signal-blue" />
              <span className="text-[11px] font-medium">Video</span>
            </button>

            <button
              onClick={() => setToastMessage('Starting Audio Call...')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-100 dark:bg-signal-dark-surface hover:bg-gray-200 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200"
            >
              <Phone className="w-5 h-5 mb-1 text-signal-blue" />
              <span className="text-[11px] font-medium">Audio</span>
            </button>

            <button
              onClick={handleToggleMute}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                isMuted
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  : 'bg-gray-100 dark:bg-signal-dark-surface hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              {isMuted ? <BellOff className="w-5 h-5 mb-1" /> : <Bell className="w-5 h-5 mb-1 text-signal-blue" />}
              <span className="text-[11px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => setToastMessage('Opening Chat Search...')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-100 dark:bg-signal-dark-surface hover:bg-gray-200 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200"
            >
              <Search className="w-5 h-5 mb-1 text-signal-blue" />
              <span className="text-[11px] font-medium">Search</span>
            </button>
          </div>

          <hr className="border-gray-100 dark:border-signal-dark-border" />

          {/* Section 1: Chat Settings */}
          <div className="space-y-4">
            {/* Disappearing Messages */}
            <div className="relative">
              <div
                onClick={() => setShowDisappearingDropdown(!showDisappearingDropdown)}
                className="flex items-start justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-signal-dark-surface cursor-pointer transition-colors"
              >
                <div className="flex space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Disappearing messages</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      When enabled, messages sent and received in this 1:1 chat will disappear after they&apos;ve been seen.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 ml-2">
                  <span>{disappearingMode}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {showDisappearingDropdown && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-signal-dark-surface rounded-xl border border-gray-200 dark:border-signal-dark-border space-y-1">
                  {(['Off', '24h', '7d', '30d'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setDisappearingMode(mode);
                        setShowDisappearingDropdown(false);
                        setToastMessage(`Disappearing messages set to ${mode}`);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 flex justify-between items-center"
                    >
                      <span>{mode === 'Off' ? 'Off' : mode === '24h' ? '24 Hours' : mode === '7d' ? '7 Days' : '30 Days'}</span>
                      {disappearingMode === mode && <Check className="w-4 h-4 text-signal-blue" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nickname Setting */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-signal-dark-surface cursor-pointer transition-colors">
              <div className="flex items-center space-x-3 flex-1" onClick={() => setIsEditingNickname(true)}>
                <Edit3 className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nickname</h3>
                  {isEditingNickname ? (
                    <input
                      type="text"
                      autoFocus
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onBlur={() => setIsEditingNickname(false)}
                      placeholder="Set custom nickname"
                      className="mt-1 w-full px-2 py-1 text-xs bg-white dark:bg-signal-dark-panel border border-signal-blue rounded-lg text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{nickname || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Color Setting */}
            <div>
              <div
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-signal-dark-surface cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chat color</h3>
                </div>
                <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: chatColor }} />
              </div>

              {showColorPicker && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-signal-dark-surface rounded-xl border border-gray-200 dark:border-signal-dark-border flex items-center space-x-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setChatColor(c);
                        setShowColorPicker(false);
                        setToastMessage('Updated chat color theme!');
                      }}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: c }}
                    >
                      {chatColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Safety Number */}
            <div
              onClick={() => setShowSafetyNumber(true)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-signal-dark-surface cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">View Safety Number</h3>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-signal-dark-border" />

          {/* Section 2: Groups in Common & Add to Group */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Groups
            </h3>

            <div className="p-3 bg-gray-50 dark:bg-signal-dark-surface rounded-xl space-y-3">
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4 text-gray-400" />
                <span>No groups in common</span>
              </div>

              {!showAddToGroup ? (
                <button
                  onClick={handleOpenAddToGroup}
                  className="flex items-center space-x-2 text-xs font-semibold text-signal-blue hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to a group</span>
                </button>
              ) : (
                <div className="pt-2 border-t border-gray-200 dark:border-signal-dark-border space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Select group to add {peerName}:
                  </label>
                  {myGroupConversations.length > 0 ? (
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-signal-dark-panel border border-gray-200 dark:border-signal-dark-border rounded-lg text-xs"
                    >
                      <option value="">-- Choose Group --</option>
                      {myGroupConversations.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.members?.length || 0} members)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-400">No group conversations found.</p>
                  )}

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => setShowAddToGroup(false)}
                      className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddUserToSelectedGroup}
                      disabled={!selectedGroupId || isAddingToGroup}
                      className="px-3 py-1 bg-signal-blue text-white text-xs font-medium rounded-lg disabled:opacity-50 flex items-center gap-1"
                    >
                      {isAddingToGroup ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-100 dark:border-signal-dark-border" />

          {/* Section 3: Danger Zone (Block User) */}
          <div>
            <button
              onClick={handleToggleBlock}
              className="w-full flex items-center space-x-3 p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold text-sm"
            >
              <Ban className="w-5 h-5" />
              <span>{isBlocked ? `Unblock ${peerName}` : `Block ${peerName}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Safety Number Sub-Modal Overlay */}
      {showSafetyNumber && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-signal-dark-panel rounded-3xl p-6 text-center shadow-2xl border border-gray-200 dark:border-signal-dark-border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-signal-blue" />
                Safety Number
              </h3>
              <button onClick={() => setShowSafetyNumber(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Verify end-to-end security with {peerName} by comparing this safety number with their device.
            </p>

            <div className="bg-gray-100 dark:bg-signal-dark-surface p-4 rounded-2xl flex flex-col items-center justify-center">
              <QrCode className="w-24 h-24 text-gray-800 dark:text-gray-200 mb-3" />
              <div className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 tracking-wider space-y-1">
                <p>39104 &bull; 81920 &bull; 48102</p>
                <p>90123 &bull; 47109 &bull; 28104</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSafetyNumber(false);
                setToastMessage('Safety number verified!');
              }}
              className="w-full py-2.5 bg-signal-blue text-white text-xs font-semibold rounded-xl hover:bg-signal-blue-hover transition-colors"
            >
              Verified
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
