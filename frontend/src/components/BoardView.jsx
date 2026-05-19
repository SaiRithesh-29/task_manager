import { useState } from 'react';
import { createList, deleteList } from '../services/listService';
import List from './List';
import ActivityPanel from './ActivityPanel';
import MembersPanel from './MembersPanel';

function BoardView({ boardData, onUpdate, onCardClick, user }) {
  const currentUserId = user?._id || user?.id || '';
  const [isAddingList, setIsAddingList] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [showActivity, setShowActivity] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState([]);

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!listTitle.trim()) return;
    try {
      const order = (boardData.lists?.length || 0) + 1;
      await createList({ title: listTitle, boardId: boardData._id, order });
      setListTitle('');
      setIsAddingList(false);
      onUpdate();
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Delete this list and all its cards?')) return;
    try {
      await deleteList(listId);
      onUpdate();
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  const allLabels = boardData.lists?.flatMap(l => l.cards?.flatMap(c => c.labels || []) || []) || [];
  const uniqueLabels = allLabels.filter((l, i, arr) => arr.findIndex(x => x.name === l.name && x.color === l.color) === i);

  const isCardVisible = (card) => {
    if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterLabels.length > 0) {
      const cardLabelKeys = (card.labels || []).map(l => `${l.name}-${l.color}`);
      return filterLabels.some(fl => cardLabelKeys.includes(fl));
    }
    return true;
  };

  const filteredLists = boardData.lists?.map(list => ({
    ...list,
    cards: list.cards?.filter(isCardVisible) || []
  })) || [];

  const totalVisible = filteredLists.reduce((sum, l) => sum + l.cards.length, 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-950 via-blue-950 to-purple-950 relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(168,85,247,0.05),transparent_60%)] pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-3 flex justify-between items-center border-b border-white/5 relative">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            {boardData.name}
            <span className={`w-2 h-2 rounded-full ${
              boardData.color === 'green' ? 'bg-green-400' : boardData.color === 'red' ? 'bg-red-400' : boardData.color === 'purple' ? 'bg-purple-400' : boardData.color === 'orange' ? 'bg-orange-400' : boardData.color === 'teal' ? 'bg-teal-400' : boardData.color === 'pink' ? 'bg-pink-400' : boardData.color === 'indigo' ? 'bg-indigo-400' : boardData.color === 'cyan' ? 'bg-cyan-400' : boardData.color === 'amber' ? 'bg-amber-400' : 'bg-blue-400'
            } animate-pulse-glow`} />
          </h2>
          <p className="text-sm text-blue-200/60 mt-0.5">
            {boardData.lists?.length || 0} lists · {totalVisible} cards
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-48 pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all"
            />
          </div>

          {/* Label Filter */}
          {uniqueLabels.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-sm px-3 py-1.5 rounded-lg transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Labels
                {filterLabels.length > 0 && <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{filterLabels.length}</span>}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-56 hidden group-hover:block z-20">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Filter by label</p>
                <div className="space-y-1">
                  {uniqueLabels.map((label, i) => {
                    const key = `${label.name}-${label.color}`;
                    const active = filterLabels.includes(key);
                    return (
                      <button
                        key={i}
                        onClick={() => setFilterLabels(prev => active ? prev.filter(x => x !== key) : [...prev, key])}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                          active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${label.color === 'green' ? 'bg-green-500' : label.color === 'red' ? 'bg-red-500' : label.color === 'blue' ? 'bg-blue-500' : label.color === 'purple' ? 'bg-purple-500' : label.color === 'orange' ? 'bg-orange-500' : label.color === 'sky' ? 'bg-sky-500' : label.color === 'lime' ? 'bg-lime-500' : label.color === 'pink' ? 'bg-pink-500' : label.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                        {label.name}
                        {active && <span className="ml-auto text-blue-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {filterLabels.length > 0 && (
                  <button onClick={() => setFilterLabels([])} className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          <button onClick={() => setShowMembers(true)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-sm px-3 py-1.5 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Team
          </button>
          <button onClick={() => setShowActivity(!showActivity)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-sm px-3 py-1.5 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showActivity ? 'Hide Log' : 'Activity'}
          </button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full items-start">
          {filteredLists.map(list => (
            <div key={list._id} className="relative group">
              {list.createdBy === currentUserId && (
                <button
                  onClick={() => handleDeleteList(list._id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10 shadow-lg"
                >
                  ×
                </button>
              )}
              <List list={list} onUpdate={onUpdate} onCardClick={onCardClick} user={user} />
            </div>
          ))}

          {isAddingList ? (
            <div className="w-72 flex-shrink-0">
              <form onSubmit={handleAddList} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
                <input
                  type="text"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  placeholder="Enter list title..."
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm border border-white/10 focus:outline-none focus:border-blue-400 placeholder-gray-400"
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20">Add List</button>
                  <button type="button" onClick={() => setIsAddingList(false)} className="text-white/50 hover:text-white text-sm px-2 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setIsAddingList(true)} className="w-72 flex-shrink-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:text-white/80 text-sm p-4 transition-all flex items-center gap-2 group">
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add another list
            </button>
          )}
        </div>
      </div>

      <ActivityPanel boardId={boardData._id} isOpen={showActivity} onClose={() => setShowActivity(false)} />

      {showMembers && (
        <MembersPanel
          board={boardData}
          onClose={(reload) => {
            setShowMembers(false);
            if (reload) onUpdate();
          }}
        />
      )}
    </div>
  );
}

export default BoardView;
