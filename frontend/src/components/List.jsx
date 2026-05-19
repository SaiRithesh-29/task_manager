import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { createCard } from '../services/cardService';
import Card from './Card';

function List({ list, onUpdate, onCardClick, user }) {
  const currentUserId = user?._id || user?.id || '';
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: list._id,
  });

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;
    try {
      await createCard({ title: cardTitle, listId: list._id });
      setCardTitle('');
      setIsAdding(false);
      onUpdate();
    } catch (err) {
      console.error('Error creating card:', err);
    }
  };

  const listColors = {
    '1.ToDo': 'from-pink-500 to-rose-500',
    '2.Progress': 'from-amber-500 to-orange-500',
    '3.Done': 'from-emerald-500 to-green-500'
  };

  const gradient = listColors[list.title] || 'from-blue-500 to-indigo-500';

  return (
    <div className="w-72 flex-shrink-0 rounded-xl bg-white/70 backdrop-blur-md shadow-lg shadow-black/5 border border-white/80 flex flex-col max-h-full transition-all duration-200 hover:shadow-xl hover:shadow-black/10">
      <div className={`bg-gradient-to-r ${gradient} p-3 rounded-t-xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="flex justify-between items-center relative">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            {list.title.replace(/^\d+\./, '')}
            <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
              {list.cards?.length || 0}
            </span>
          </h3>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] transition-all duration-200 ${
          isOver ? 'bg-blue-50/50' : ''
        }`}
      >
        {list.cards?.length > 0 ? (
          list.cards.map(card => (
            <div key={card._id} className="animate-fade-in">
              <Card card={card} onClick={onCardClick} user={user} currentUserId={currentUserId} />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400 italic">
            No cards yet
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-100/80">
        {isAdding ? (
          <form onSubmit={handleAddCard} className="animate-fade-in">
            <textarea
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80"
              rows="3"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-blue-500/20"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-600 text-sm px-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : currentUserId === list.createdBy && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 text-sm p-2 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}

export default List;
