import { useState } from 'react';
import { createBoard, updateBoard, deleteBoard } from '../services/boardService';
import TeamPanel from './TeamPanel';
import { getFullUrl } from '../services/api';

const BOARD_COLORS = [
  { name: 'blue', bg: 'bg-blue-500' },
  { name: 'green', bg: 'bg-green-500' },
  { name: 'red', bg: 'bg-red-500' },
  { name: 'purple', bg: 'bg-purple-500' },
  { name: 'orange', bg: 'bg-orange-500' },
  { name: 'teal', bg: 'bg-teal-500' },
  { name: 'pink', bg: 'bg-pink-500' },
  { name: 'indigo', bg: 'bg-indigo-500' },
  { name: 'cyan', bg: 'bg-cyan-500' },
  { name: 'amber', bg: 'bg-amber-500' },
];

function Sidebar({ boards, sharedBoards, selectedBoard, onSelectBoard, onBoardsUpdate, user, onLogout, boardData, onViewProfile, isMobileOpen, onMobileClose }) {
  const currentUserId = user?._id || user?.id;
  const [isCreating, setIsCreating] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsColor, setSettingsColor] = useState('blue');
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showTeamPanel, setShowTeamPanel] = useState(false);

  const canDeleteBoard = (board) => {
    if (!board || !currentUserId) return false;
    const creatorId = board.createdBy || board.createdBy?._id;
    return String(creatorId) === String(currentUserId);
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    try {
      const res = await createBoard({ name: boardName, color: selectedColor });
      setBoardName('');
      setSelectedColor('blue');
      setIsCreating(false);
      onBoardsUpdate();
      onSelectBoard(res.data._id);
    } catch (err) {
      console.error('Error creating board:', err);
    }
  };

  const getColorBg = (color) => BOARD_COLORS.find(c => c.name === color)?.bg || 'bg-blue-500';

  const openSettings = () => {
    if (!boardData) return;
    setSettingsName(boardData.name || '');
    setSettingsColor(boardData.color || 'blue');
    setShowSettings(true);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsName.trim() || !selectedBoard) return;
    setSavingSettings(true);
    try {
      await updateBoard(selectedBoard, { name: settingsName, color: settingsColor });
      setShowSettings(false);
      onBoardsUpdate();
    } catch (err) {
      console.error('Error updating board:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation();
    const boardToDelete = [...boards, ...sharedBoards].find(b => b._id === boardId);
    if (!canDeleteBoard(boardToDelete)) {
      alert('Only the board creator can delete this board');
      return;
    }
    if (!confirm('Are you sure you want to delete this board and all its content?')) return;
    setDeletingId(boardId);
    try {
      await deleteBoard(boardId);
      if (selectedBoard === boardId) onSelectBoard(null);
      onBoardsUpdate();
    } catch (err) {
      console.error('Error deleting board:', err);
      alert(err.response?.data?.error || 'Error deleting board');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBoards = boards.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCards = boardData?.lists?.reduce((sum, l) => sum + (l.cards?.length || 0), 0) || 0;

  const allAttachments = (boardData?.lists || []).flatMap(list =>
    (list.cards || []).flatMap(card =>
      (card.attachments || []).map(att => ({ ...att, cardTitle: card.title, cardId: card._id }))
    )
  );

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onMobileClose} />
      )}
      <div className={`
        ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 animate-slide-in-left' : 'hidden'}
        md:relative md:block md:w-60
        bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white flex flex-col h-screen select-none
      `}>
        {/* Mobile close button */}
        {isMobileOpen && (
          <button onClick={onMobileClose} className="absolute top-3 right-3 text-gray-400 hover:text-white md:hidden z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* User Profile */}
        <div className="p-4 border-b border-white/5 relative">
          <button
            onClick={onViewProfile}
            className="w-full flex items-center gap-3 hover:bg-white/5 -m-1 p-1 rounded-lg transition-colors text-left"
          >
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white text-sm flex items-center justify-center font-bold shadow-lg shadow-purple-500/20 ring-2 ring-white/10">
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white/90">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" title="Online" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700">
        {/* Board Search */}
        {boards.length > 3 && (
          <div className="relative mb-3">
            <svg className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter boards..."
              className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
            />
          </div>
        )}

        {/* Boards */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Boards</p>
            <button
              onClick={() => { setIsCreating(true); setSearchQuery(''); }}
              className="text-gray-400 hover:text-white hover:bg-gray-800 w-5 h-5 flex items-center justify-center rounded transition-all text-lg leading-none"
              title="Create board"
            >
              +
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateBoard} className="mb-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Board name"
                className="w-full px-2.5 py-1.5 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-400"
                autoFocus
              />
              <div className="mt-2.5">
                <p className="text-xs text-gray-400 mb-1.5">Color</p>
                <div className="flex gap-1.5 flex-wrap">
                  {BOARD_COLORS.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-5 h-5 rounded-full ${c.bg} ${
                        selectedColor === c.name ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800 scale-110' : 'opacity-60 hover:opacity-100'
                      } transition-all`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {filteredBoards.length === 0 ? (
              <p className="text-xs text-gray-500 py-2 text-center">No boards found</p>
            ) : (
              filteredBoards.map(board => {
                const isActive = selectedBoard === board._id;
                return (
                  <div
                    key={board._id}
                    onClick={() => onSelectBoard(board._id)}
                    className={`group flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 rounded-r-lg cursor-pointer text-sm transition-all ${
                      isActive
                        ? 'bg-gray-700/70 border-l-2 border-l-transparent'
                        : 'hover:bg-gray-800/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${getColorBg(board.color)} flex-shrink-0 shadow-sm`} />
                    <span className={`flex-1 truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                      {board.name}
                    </span>
                    {canDeleteBoard(board) && (
                      <button
                        onClick={(e) => handleDeleteBoard(e, board._id)}
                        disabled={deletingId === board._id}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-sm px-1"
                        title="Delete board"
                      >
                        {deletingId === board._id ? '...' : '×'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Shared with Me */}
        {sharedBoards.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Shared with Me</p>
            <div className="space-y-0.5">
              {sharedBoards.map(board => {
                const isActive = selectedBoard === board._id;
                const creator = board.members?.find(m => m.userId === board.createdBy);
                return (
                  <div
                    key={board._id}
                    onClick={() => onSelectBoard(board._id)}
                    className={`group flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 rounded-r-lg cursor-pointer text-sm transition-all ${
                      isActive
                        ? 'bg-gray-700/70 border-l-2 border-l-blue-500'
                        : 'hover:bg-gray-800/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${getColorBg(board.color)} flex-shrink-0 shadow-sm`} />
                    <div className="flex-1 min-w-0">
                      <span className={`block truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {board.name}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate block">
                        by {creator?.name || creator?.email || 'Unknown'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && boardData && (
          <div className="mb-6 p-3 bg-gray-800 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Board Settings</p>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white text-lg leading-none transition-colors">×</button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <input
                type="text"
                value={settingsName}
                onChange={e => setSettingsName(e.target.value)}
                placeholder="Board name"
                className="w-full px-2.5 py-1.5 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-400 mb-3"
              />
              <p className="text-xs text-gray-400 mb-1.5">Color</p>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {BOARD_COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSettingsColor(c.name)}
                    className={`w-5 h-5 rounded-full ${c.bg} ${
                      settingsColor === c.name ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800 scale-110' : 'opacity-60 hover:opacity-100'
                    } transition-all`}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={savingSettings || !settingsName.trim()}
                className="w-full bg-blue-600 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {savingSettings ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        {boardData && (
          <div className="mb-6 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {boardData.lists?.length || 0} lists
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {totalCards} cards
            </span>
            <button
              onClick={() => setShowTeamPanel(true)}
              className="ml-auto flex items-center gap-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs font-medium transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Team ({boardData.members?.length || 0})
            </button>
          </div>
        )}

        {/* Attachments */}
        {boardData && allAttachments.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className="flex items-center justify-between w-full text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 hover:text-white transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attachments
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">{allAttachments.length}</span>
                <svg
                  className={`w-2.5 h-2.5 transition-transform duration-200 ${showAttachments ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${showAttachments ? 'max-h-48' : 'max-h-0'}`}>
              <div className="space-y-0.5 pt-0.5">
                {allAttachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={getFullUrl(att.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-1.5 rounded text-xs hover:bg-gray-800 transition-colors group"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate flex-1 text-gray-400 group-hover:text-white transition-colors">{att.fileName}</span>
                    <span className="text-gray-600 truncate max-w-[70px] text-[10px]">{att.cardTitle}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/5 space-y-0.5 relative">
        <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        <button onClick={openSettings} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {showTeamPanel && boardData && (
        <TeamPanel
          board={boardData}
          user={user}
          onClose={(left) => {
            setShowTeamPanel(false);
            if (left) onBoardsUpdate();
          }}
          onUpdate={onBoardsUpdate}
        />
      )}
      </div>
    </>
  );
}

export default Sidebar;
