import { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { getBoards, getBoardFull, getSharedBoards, getOnlineMembers } from './services/boardService';
import { updateCard } from './services/cardService';
import socket from './services/socket';
import Sidebar from './components/Sidebar';
import BoardView from './components/BoardView';
import CardModal from './components/CardModal';
import AuthPage from './components/AuthPage';
import TeamCollaboration from './components/TeamCollaboration';
import NotificationBell from './components/NotificationBell';
import ProfileModal from './components/ProfileModal';
import Logo from './components/Logo';
import { getFullUrl } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [sharedBoards, setSharedBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          socket.connect();
          socket.emit('register-user', { userId: parsed._id || parsed.id });
        }
        loadBoards();
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    return () => { socket.disconnect(); };
  }, []);

  const handleAuth = (userData) => {
    setUser(userData);
    socket.connect();
    socket.emit('register-user', { userId: userData._id || userData.id });
    loadBoards();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBoards([]);
    setSharedBoards([]);
    setSelectedBoard(null);
    setBoardData(null);
    socket.disconnect();
  };

  useEffect(() => {
    if (selectedBoard && user) {
      loadBoardData(selectedBoard);
      const uid = user._id || user.id;
      socket.emit('register-user', { userId: uid });
      socket.emit('join-board', { boardId: selectedBoard, userId: uid, userName: user.name || user.email });
    }
    return () => {
      if (selectedBoard && user) {
        const uid = user._id || user.id;
        socket.emit('leave-board', { boardId: selectedBoard, userId: uid });
      }
    };
  }, [selectedBoard, user]);

  useEffect(() => {
    const refresh = () => { if (selectedBoard) loadBoardData(selectedBoard); };

    socket.on('card-created', refresh);
    socket.on('card-moved', refresh);
    socket.on('card-deleted', refresh);
    socket.on('card-updated', refresh);
    socket.on('card-archived', refresh);
    socket.on('card-unarchived', refresh);
    socket.on('list-created', refresh);
    socket.on('list-deleted', refresh);

    return () => {
      socket.off('card-created', refresh);
      socket.off('card-moved', refresh);
      socket.off('card-deleted', refresh);
      socket.off('card-updated', refresh);
      socket.off('card-archived', refresh);
      socket.off('card-unarchived', refresh);
      socket.off('list-created', refresh);
      socket.off('list-deleted', refresh);
    };
  }, [selectedBoard]);

  useEffect(() => {
    const handleUserOnline = (data) => {
      setOnlineMembers(data.onlineMembers || []);
    };
    const handleUserOffline = (data) => {
      setOnlineMembers(data.onlineMembers || []);
    };

    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    return () => {
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
    };
  }, [selectedBoard]);

  useEffect(() => {
    const loadOnlineMembers = async () => {
      if (selectedBoard) {
        try {
          const res = await getOnlineMembers(selectedBoard);
          setOnlineMembers(res.data || []);
        } catch (err) {
          console.error('Error loading online members:', err);
        }
      }
    };
    loadOnlineMembers();
  }, [selectedBoard]);

  const loadBoards = async () => {
    try {
      const [myBoardsRes, sharedRes] = await Promise.all([
        getBoards(),
        getSharedBoards()
      ]);
      setBoards(myBoardsRes.data);
      setSharedBoards(sharedRes.data);
      if (myBoardsRes.data.length > 0 && !selectedBoard) {
        setSelectedBoard(myBoardsRes.data[0]._id);
      } else if (myBoardsRes.data.length === 0 && sharedRes.data.length > 0 && !selectedBoard) {
        setSelectedBoard(sharedRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBoardData = async (boardId) => {
    try {
      const res = await getBoardFull(boardId);
      setBoardData(res.data);
    } catch (err) {
      console.error('Error loading board data:', err);
    }
  };

  const findListId = (id) => {
    if (!boardData?.lists) return null;
    for (const list of boardData.lists) {
      if (list._id === id) return list._id;
      if (list.cards?.some(c => c._id === id)) return list._id;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const card = boardData?.lists
      ?.flatMap(l => l.cards || [])
      .find(c => c._id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const targetListId = findListId(over.id);
    if (targetListId) {
      try {
        await updateCard(active.id, { listId: targetListId });
        loadBoardData(selectedBoard);
      } catch (err) {
        console.error('Error moving card:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Logo className="w-16 h-16 animate-float" />
          <p className="text-sm text-gray-400 animate-pulse-glow">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row h-screen">
        <Sidebar
            boards={boards}
            sharedBoards={sharedBoards}
            selectedBoard={selectedBoard}
            onSelectBoard={(id) => { setSelectedBoard(id); setSidebarOpen(false); }}
            onBoardsUpdate={loadBoards}
            user={user}
            onLogout={handleLogout}
            boardData={boardData}
            onViewProfile={() => { setShowProfile(true); setSidebarOpen(false); }}
            isMobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
          />

        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex flex-col min-w-0">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-3 md:px-5 py-2.5 flex justify-between items-center shadow-lg shadow-black/5 border-b border-white/5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Logo className="w-7 h-7 flex-shrink-0 hidden md:block" />
              {boardData?.color && (
                <span className={`w-2.5 h-2.5 rounded-full ${
                  boardData.color === 'green' ? 'bg-green-400' : boardData.color === 'red' ? 'bg-red-400' : boardData.color === 'purple' ? 'bg-purple-400' : boardData.color === 'orange' ? 'bg-orange-400' : boardData.color === 'teal' ? 'bg-teal-400' : boardData.color === 'pink' ? 'bg-pink-400' : boardData.color === 'indigo' ? 'bg-indigo-400' : boardData.color === 'cyan' ? 'bg-cyan-400' : boardData.color === 'amber' ? 'bg-amber-400' : 'bg-blue-400'
                } shadow-sm flex-shrink-0`} />
              )}
              <span className="text-sm font-medium tracking-wide truncate">{boardData?.name || 'Task Manager'}</span>
            </div>
            {onlineMembers.length > 0 && (
              <div className="hidden md:flex items-center gap-3 mx-4">
                <div className="flex -space-x-2">
                  {onlineMembers.slice(0, 4).map((member, i) => (
                    <div
                      key={member.userId || i}
                      className="relative group"
                    >
                      {member.profilePhoto ? (
                        <img
                          src={getFullUrl(member.profilePhoto)}
                          alt={member.userName}
                          className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-white">
                          {(member.userName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {member.userName}
                        <span className="text-green-400 ml-1">• online</span>
                      </div>
                    </div>
                  ))}
                  {onlineMembers.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-white">
                      +{onlineMembers.length - 4}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-green-400 font-medium">
                    {onlineMembers.length} online
                  </span>
                  <div className="text-[10px] text-gray-400">
                    {onlineMembers.map(m => m.userName).join(', ')}
                  </div>
                </div>
              </div>
            )}
            <NotificationBell userId={user?._id || user?.id} />
            <TeamCollaboration board={boardData} user={user} onUpdate={() => loadBoardData(selectedBoard)} />
          </div>
          <div className="flex-1 overflow-hidden relative">
            {boardData ? (
              <BoardView
                boardData={boardData}
                onUpdate={() => loadBoardData(selectedBoard)}
                onCardClick={setSelectedCard}
                user={user}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/50 flex items-center justify-center animate-float">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse-glow">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-500">Select or create a board to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="bg-white rounded-lg shadow-2xl border border-blue-300 p-3 w-72 rotate-2 opacity-90">
            <p className="text-sm text-gray-800 font-medium">{activeCard.title}</p>
            {activeCard.attachments?.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {activeCard.attachments.length} attachment(s)
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={() => loadBoardData(selectedBoard)}
          boardMembers={boardData?.members || []}
          user={user}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </DndContext>
  );
}

export default App;
