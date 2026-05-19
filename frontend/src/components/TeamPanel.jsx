import { useState, useEffect } from 'react';
import { addMember, removeMember } from '../services/memberService';
import socket from '../services/socket';

function TeamPanel({ board, user, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!board?._id) return;

    const handleOnline = (data) => {
      setOnlineMembers(data.onlineMembers || []);
    };

    const handleOffline = (data) => {
      setOnlineMembers(data.onlineMembers || []);
    };

    socket.on('user-online', handleOnline);
    socket.on('user-offline', handleOffline);

    return () => {
      socket.off('user-online', handleOnline);
      socket.off('user-offline', handleOffline);
    };
  }, [board?._id]);

  const isOnline = (userId) => {
    return onlineMembers.some(m => m.userId === userId);
  };

  const isAdmin = (member) => {
    return member.role === 'admin' || member.userId === board?.createdBy;
  };

  const canManage = () => {
    const currentMember = board?.members?.find(m => m.userId === (user?._id || user?.id));
    return currentMember && (currentMember.role === 'admin' || currentMember.userId === board?.createdBy);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) return;

    setLoading(true);
    try {
      await addMember(board._id, email);
      setEmail('');
      setSuccess('Member added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      onUpdate();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error adding member';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.userId === user?._id || member.userId === user?.id) {
      if (!confirm('Are you sure you want to leave this board?')) return;
    } else {
      if (!confirm(`Remove ${member.name || member.email} from this board?`)) return;
    }

    try {
      await removeMember(board._id, member.userId);
      onUpdate();
      if (member.userId === user?._id || member.userId === user?.id) {
        onClose(true);
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Error removing member');
      setTimeout(() => setError(''), 3000);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${board._id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!board) return null;

  const currentUserId = user?._id || user?.id;
  const isCurrentUserAdmin = canManage();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => onClose()}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Team Collaboration
              </h2>
              <p className="text-blue-100 text-sm mt-1">{board.name}</p>
            </div>
            <button
              onClick={() => onClose()}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-lg">👥</span>
              Members ({board.members?.length || 0})
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {onlineMembers.length} online
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {board.members?.map((member, idx) => {
              const online = isOnline(member.userId);
              const admin = isAdmin(member);
              const isMe = member.userId === currentUserId;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center">
                      {(member.name || member.email || '?').charAt(0).toUpperCase()}
                    </div>
                    {online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {member.name || member.email}
                        {isMe && <span className="text-gray-400 font-normal ml-1">(you)</span>}
                      </span>
                      {admin && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {online ? (
                      <span className="text-xs text-green-600">Online</span>
                    ) : (
                      <span className="text-xs text-gray-400">Offline</span>
                    )}

                    {(isCurrentUserAdmin && !isMe) && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded transition-all"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {isMe && board.members?.length > 1 && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded transition-all text-xs"
                        title="Leave board"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isCurrentUserAdmin && (
            <div className="border-t pt-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-lg">✉️</span>
                Invite New Members
              </h3>

              <form onSubmit={handleAddMember} className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </form>

              {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">
                  {success}
                </div>
              )}

              <button
                onClick={copyInviteLink}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? 'Link copied!' : 'Copy invite link'}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Board created {board.createdAt ? new Date(board.createdAt).toLocaleDateString() : 'recently'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeamPanel;