import { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';

function TeamCollaboration({ board, user, onUpdate }) {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [newNotifications, setNewNotifications] = useState(0);
  const [cursorPositions, setCursorPositions] = useState({});
  const [editingCards, setEditingCards] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const activityRef = useRef(null);

  const copyShareLink = (e) => {
    e.stopPropagation();
    const shareLink = `${window.location.origin}/board/${board._id}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!board?._id || !user?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-board', {
      boardId: board._id,
      userId: user._id,
      userName: user.name || user.email
    });

    setIsConnected(true);

    const handleUserOnline = (data) => {
      setOnlineMembers(data.onlineMembers || []);
    };

    const handleUserOffline = (data) => {
      setOnlineMembers(data.onlineMembers || []);
    };

    const handleActivity = (activity) => {
      if (activity.user?.userId !== user._id) {
        setActivities(prev => [activity, ...prev].slice(0, 50));
        setNewNotifications(prev => prev + 1);
      }
    };

    const handleCardCreated = (card) => {
      setActivities(prev => [{
        ...card,
        user: { name: 'Someone' },
        action: 'create_card',
        description: `Created card "${card.title}"`,
        createdAt: new Date()
      }, ...prev].slice(0, 50));
    };

    const handleCardUpdated = (card) => {
      setActivities(prev => [{
        user: { name: 'Someone' },
        action: 'update_card',
        description: `Updated card "${card.title}"`,
        createdAt: new Date()
      }, ...prev].slice(0, 50));
    };

    const handleCardMoved = (card) => {
      setActivities(prev => [{
        user: { name: 'Someone' },
        action: 'move_card',
        description: `Moved card "${card.title}"`,
        createdAt: new Date()
      }, ...prev].slice(0, 50));
    };

    const handleCardBeingEdited = (data) => {
      if (data.userId !== user._id) {
        setEditingCards(prev => ({ ...prev, [data.cardId]: data.userName }));
      }
    };

    const handleCardEditCancelled = (data) => {
      setEditingCards(prev => {
        const newState = { ...prev };
        delete newState[data.cardId];
        return newState;
      });
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => {
          const newState = { ...prev };
          if (data.type === 'start') {
            newState[data.target] = data.userName;
          } else {
            delete newState[data.target];
          }
          return newState;
        });
      }
    };

    const handleCursorUpdate = (data) => {
      if (data.userId !== user._id) {
        setCursorPositions(prev => ({ ...prev, [data.userId]: data.position }));
        setTimeout(() => {
          setCursorPositions(prev => {
            const newState = { ...prev };
            delete newState[data.userId];
            return newState;
          });
        }, 5000);
      }
    };

    const handleMemberRemoved = (data) => {
      if (data.userId === user._id) {
        setTimeout(() => onUpdate(), 1000);
      }
    };

    const handleMemberLeft = (data) => {
      setActivities(prev => [{
        user: { name: data.name },
        action: 'member_left',
        description: `${data.name} left the board`,
        createdAt: new Date()
      }, ...prev].slice(0, 50));
    };

    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('activity', handleActivity);
    socket.on('card-created', handleCardCreated);
    socket.on('card-updated', handleCardUpdated);
    socket.on('card-moved', handleCardMoved);
    socket.on('card-being-edited', handleCardBeingEdited);
    socket.on('card-edit-cancelled', handleCardEditCancelled);
    socket.on('user-typing', handleUserTyping);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('member-removed', handleMemberRemoved);
    socket.on('member-left', handleMemberLeft);

    return () => {
      socket.emit('leave-board', { boardId: board._id, userId: user._id });
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('activity', handleActivity);
      socket.off('card-created', handleCardCreated);
      socket.off('card-updated', handleCardUpdated);
      socket.off('card-moved', handleCardMoved);
      socket.off('card-being-edited', handleCardBeingEdited);
      socket.off('card-edit-cancelled', handleCardEditCancelled);
      socket.off('user-typing', handleUserTyping);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('member-removed', handleMemberRemoved);
      socket.off('member-left', handleMemberLeft);
    };
  }, [board?._id, user?._id]);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create_card': return '+';
      case 'update_card': return '✎';
      case 'move_card': return '↔';
      case 'delete_card': return '×';
      case 'add_subtask': return '☑';
      case 'toggle_subtask': return '✓';
      case 'upload_file': return '📎';
      case 'add_comment': return '💬';
      case 'assign_user': return '👤';
      case 'create_board': return '📋';
      case 'member_left': return '👋';
      default: return '•';
    }
  };

  const currentUserId = user?._id || user?.id;
  const otherOnlineMembers = onlineMembers.filter(m => m.userId !== currentUserId);
  const memberCount = board?.members?.length || 0;

  return (
    <div className="flex items-center gap-3">
      {isConnected && (
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live
        </div>
      )}

      <div className="flex items-center gap-2 px-2 py-1 bg-gray-700/50 rounded-lg text-xs">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-gray-300">{memberCount}</span>
        <span className="text-gray-500">member{memberCount !== 1 ? 's' : ''}</span>
      </div>

      <button
        onClick={copyShareLink}
        className="flex items-center gap-1.5 px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white text-xs rounded-lg transition-all"
        title="Share board"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'Copied!' : 'Share'}
      </button>

      {otherOnlineMembers.length > 0 && (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {otherOnlineMembers.slice(0, 5).map((member, idx) => (
              <div
                key={member.userId}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm"
                title={`${member.userId === currentUserId ? 'You' : 'Online: ' + member.userId}`}
                style={{ zIndex: 5 - idx }}
              >
                {(member.userId === currentUserId ? user?.name : member.userId)?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {otherOnlineMembers.length > 5 && (
            <span className="ml-1 text-xs text-gray-400">+{otherOnlineMembers.length - 5}</span>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setShowActivityPanel(true);
          setNewNotifications(0);
        }}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-700/50 rounded-lg transition-all"
        title="Activity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {newNotifications > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {newNotifications > 9 ? '9+' : newNotifications}
          </span>
        )}
      </button>

      {showActivityPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowActivityPanel(false)}>
          <div
            ref={activityRef}
            className="w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Team Activity
              </h3>
              <button
                onClick={() => setShowActivityPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                {onlineMembers.length} online
              </span>
              <span className="text-gray-300">|</span>
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="p-3 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {(activity.user?.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">{getActionIcon(activity.action)}</span>
                            <span className="text-sm text-gray-800 font-medium truncate">
                              {activity.user?.name || 'Someone'}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {getTimeAgo(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {activity.description || activity.action?.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setActivities([]);
                  setNewNotifications(0);
                }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Clear activity log
              </button>
            </div>
          </div>
        </div>
      )}

      {Object.keys(editingCards).length > 0 && (
        <div className="fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-xs text-gray-500 mb-2">Currently editing:</p>
          {Object.entries(editingCards).map(([cardId, userName]) => (
            <div key={cardId} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">
                {(userName || 'U').charAt(0)}
              </span>
              <span>{userName} is editing...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamCollaboration;