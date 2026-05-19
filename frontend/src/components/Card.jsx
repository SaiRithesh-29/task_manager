import { useDraggable } from '@dnd-kit/core';

const LABEL_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  sky: 'bg-sky-500',
  lime: 'bg-lime-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500'
};

function Card({ card, onClick, user }) {
  const currentUserId = user?._id || user?.id || '';
  const isCreator = card.createdBy === currentUserId;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card._id,
    data: { listId: card.listId },
    disabled: !isCreator
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  } : undefined;

  const completedSubtasks = card.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = card.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !dueDate.toDateString().includes(new Date().toDateString());
  const isDueSoon = dueDate && !isOverdue && (dueDate - new Date()) < 86400000 * 2;
  const dueDateStr = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick && onClick(card)}
      style={style}
      className={`group bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 transition-all duration-200 relative overflow-hidden ${
        isDragging ? 'shadow-2xl rotate-2 scale-105 border-blue-400 ring-2 ring-blue-400/20' : ''
      }`}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-3 right-3 h-0.5 bg-gradient-to-r from-blue-400/0 via-blue-400/40 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label, i) => (
            <span
              key={i}
              className={`${LABEL_COLORS[label.color] || 'bg-gray-500'} text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-800 font-medium leading-snug">{card.title}</p>

      <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400 flex-wrap">
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {dueDateStr && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : isDueSoon ? 'text-orange-500' : ''}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dueDateStr}
          </span>
        )}

        {card.assignees && card.assignees.length > 0 && (
          <span className="flex items-center -space-x-1.5">
            {card.assignees.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[9px] flex items-center justify-center border border-white font-medium"
                title={a.name}
              >
                {a.name?.charAt(0).toUpperCase() || '?'}
              </span>
            ))}
            {card.assignees.length > 3 && (
              <span className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[9px] flex items-center justify-center border border-white font-medium">
                +{card.assignees.length - 3}
              </span>
            )}
          </span>
        )}

        {card.attachments && card.attachments.length > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {card.attachments.length}
          </span>
        )}
      </div>

      {totalSubtasks > 0 && (
        <div className="mt-2.5 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              subtaskProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${subtaskProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default Card;
