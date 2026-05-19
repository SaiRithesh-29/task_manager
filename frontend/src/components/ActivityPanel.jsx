import { useState, useEffect } from 'react';
import { getActivities } from '../services/activityService';
import socket from '../services/socket';

function ActivityPanel({ boardId, isOpen, onClose }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!boardId) return;

    loadActivities();

    socket.emit('join-board', boardId);
    socket.on('activity', handleNewActivity);

    return () => {
      socket.off('activity', handleNewActivity);
    };
  }, [boardId]);

  const loadActivities = async () => {
    try {
      const res = await getActivities(boardId);
      setActivities(res.data);
    } catch (err) {
      console.error('Error loading activities:', err);
    }
  };

  const handleNewActivity = (activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActionIcon = (action) => {
    const icons = {
      create_card: 'text-green-500',
      delete_card: 'text-red-500',
      move_card: 'text-blue-500',
      create_list: 'text-purple-500',
      delete_list: 'text-red-500',
      upload_file: 'text-gray-500',
      create_board: 'text-blue-500',
      delete_board: 'text-red-500',
      update_card: 'text-amber-500',
      add_comment: 'text-sky-500',
      delete_comment: 'text-red-500',
      assign_user: 'text-indigo-500',
      unassign_user: 'text-gray-500',
      set_due_date: 'text-orange-500',
      archive_card: 'text-gray-500',
      add_subtask: 'text-teal-500',
      toggle_subtask: 'text-green-500',
      remove_subtask: 'text-red-500',
      add_label: 'text-pink-500',
      remove_label: 'text-gray-500',
    };
    return icons[action] || 'text-gray-400';
  };

  const getActionIconSvg = (action) => {
    const svgs = {
      create_card: 'M12 4v16m8-8H4',
      delete_card: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      move_card: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      create_list: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      upload_file: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
      create_board: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      add_comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      assign_user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      set_due_date: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      archive_card: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      add_subtask: 'M9 5l7 7-7 7',
      toggle_subtask: 'M5 13l4 4L19 7',
      update_card: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    };
    return svgs[action] || 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-40 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600">
        <h2 className="font-bold text-white flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity Log
        </h2>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Changes will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act._id} className="flex gap-3 group">
                <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${getActionIcon(act.action)}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIconSvg(act.action)} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{act.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {act.user?.name && <span className="text-xs font-medium text-gray-500">{act.user.name}</span>}
                    <span className="text-xs text-gray-400">{formatDate(act.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityPanel;
