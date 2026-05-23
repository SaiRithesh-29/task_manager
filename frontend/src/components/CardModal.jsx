import { useState } from 'react';
import api, { getFullUrl } from '../services/api';
import {
  updateCard,
  updateLabels,
  addSubtask,
  toggleSubtask,
  removeSubtask,
  addComment,
  deleteComment,
  updateAssignees,
  archiveCard,
  deleteCard,
  deleteAttachment
} from '../services/cardService';

const PRESET_LABELS = [
  { name: 'Feature', color: 'green' },
  { name: 'Bug', color: 'red' },
  { name: 'Enhancement', color: 'blue' },
  { name: 'Design', color: 'purple' },
  { name: 'Urgent', color: 'orange' },
  { name: 'Question', color: 'sky' },
  { name: 'Docs', color: 'gray' },
  { name: 'Test', color: 'lime' },
];

const LABEL_BG = {
  green: 'bg-green-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500',
  red: 'bg-red-500', purple: 'bg-purple-500', blue: 'bg-blue-500',
  sky: 'bg-sky-500', lime: 'bg-lime-500', pink: 'bg-pink-500', gray: 'bg-gray-500'
};

function CardModal({ card: initialCard, onClose, onUpdate, boardMembers = [], user: userProp }) {
  const user = userProp || JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user?._id || user?.id || '';
  const isCreator = initialCard.createdBy === currentUserId;
  const [card, setCard] = useState(initialCard);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  const saveCard = async () => {
    setSaving(true);
    try {
      const updates = {};
      if (title !== card.title) updates.title = title;
      if (description !== (card.description || '')) updates.description = description;
      if (dueDate !== (card.dueDate ? card.dueDate.split('T')[0] : '')) updates.dueDate = dueDate || null;
      if (Object.keys(updates).length > 0) {
        await updateCard(card._id, updates);
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving card:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    try {
      const res = await addSubtask(card._id, subtaskTitle);
      setCard(res.data);
      setSubtaskTitle('');
      onUpdate();
    } catch (err) {
      console.error('Error adding subtask:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const res = await toggleSubtask(card._id, subtaskId);
      setCard(res.data);
      onUpdate();
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const handleRemoveSubtask = async (subtaskId) => {
    try {
      const res = await removeSubtask(card._id, subtaskId);
      setCard(res.data);
      onUpdate();
    } catch (err) {
      console.error('Error removing subtask:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await addComment(card._id, commentText, user.name || 'Unknown');
      setCard(res.data);
      setCommentText('');
      onUpdate();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await deleteComment(card._id, commentId);
      setCard(res.data);
      onUpdate();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleToggleLabel = async (label) => {
    const hasLabel = card.labels?.some(l => l.name === label.name && l.color === label.color);
    const newLabels = hasLabel
      ? (card.labels || []).filter(l => !(l.name === label.name && l.color === label.color))
      : [...(card.labels || []), label];
    try {
      const res = await updateLabels(card._id, newLabels);
      setCard(res.data);
      onUpdate();
    } catch (err) {
      console.error('Error updating labels:', err);
    }
  };

  const handleToggleAssignee = async (member) => {
    const hasAssignee = card.assignees?.some(a => a.userId === member.userId);
    const newAssignees = hasAssignee
      ? (card.assignees || []).filter(a => a.userId !== member.userId)
      : [...(card.assignees || []), { userId: member.userId, name: member.name, email: member.email }];
    try {
      const res = await updateAssignees(card._id, newAssignees);
      setCard(res.data);
      onUpdate();
    } catch (err) {
      console.error('Error updating assignees:', err);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveCard(card._id, true);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error archiving card:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card permanently?')) return;
    try {
      await deleteCard(card._id);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  const handleDeleteAttachment = async (idx) => {
    if (!confirm('Remove this attachment?')) return;
    try {
      const res = await deleteAttachment(card._id, idx);
      setCard(res.data);
      onUpdate();
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.target.files ? Array.from(e.target.files) : selectedFiles;
    if (files.length === 0) return;

    setUploading(true);

    files.forEach(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post(`/cards/${card._id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCard(res.data);
        onUpdate();
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    });

    setUploading(false);
    setSelectedFiles([]);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setUploading(true);
      files.forEach(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await api.post(`/cards/${card._id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setCard(res.data);
          onUpdate();
        } catch (err) {
          console.error('Error uploading file:', err);
        }
      });
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'file';
  };

  const getFileColor = (type) => {
    switch (type) {
      case 'image': return 'text-purple-500';
      case 'pdf': return 'text-red-500';
      case 'doc': return 'text-blue-500';
      case 'sheet': return 'text-green-500';
      case 'archive': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const completedSubtasks = card.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = card.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subtasks', label: `Subtasks${totalSubtasks > 0 ? ` (${completedSubtasks}/${totalSubtasks})` : ''}` },
    { id: 'comments', label: `Comments${card.comments?.length ? ` (${card.comments.length})` : ''}` },
    { id: 'activity', label: 'Activity' },
  ];

  const allMembers = boardMembers.length > 0 ? boardMembers : card.assignees || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 py-0 sm:py-10 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full sm:w-[680px] min-h-screen sm:min-h-0 max-h-full sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10 rounded-t-xl">
          <div className="flex-1 mr-4">
            <input
              value={title}
              onChange={e => isCreator && setTitle(e.target.value)}
              onBlur={isCreator ? saveCard : undefined}
              disabled={!isCreator}
              className={`w-full text-xl font-bold text-gray-900 border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-1 transition-colors ${!isCreator ? 'bg-transparent cursor-not-allowed' : ''}`}
            />
            <p className="text-xs text-gray-400 mt-1">
              {card.createdAt && ` · Created ${formatDate(card.createdAt)}`}
              {card.createdAt && ` · Created ${formatDate(card.createdAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-blue-500">Saving...</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-0 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Labels */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Labels</h4>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LABELS.map(label => {
                    const active = card.labels?.some(l => l.name === label.name && l.color === label.color);
                    return (
                      <button
                        key={`${label.name}-${label.color}`}
                        onClick={() => isCreator && handleToggleLabel(label)}
                        disabled={!isCreator}
                        className={`${LABEL_BG[label.color]} text-white text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          active ? 'ring-2 ring-offset-1 ring-gray-400 scale-105' : isCreator ? 'opacity-60 hover:opacity-100' : 'opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Date</h4>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => isCreator && setDueDate(e.target.value)}
                  onBlur={isCreator ? saveCard : undefined}
                  disabled={!isCreator}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {dueDate && isCreator && (
                  <button onClick={() => { setDueDate(''); setTimeout(saveCard, 100); }} className="ml-2 text-xs text-red-500 hover:text-red-700">
                    Clear
                  </button>
                )}
              </div>

              {/* Assignees */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assignees</h4>
                {allMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allMembers.map((member, i) => {
                      const assigned = card.assignees?.some(a => a.userId === member.userId);
                      return (
                        <button
                          key={member.userId || i}
                          onClick={() => isCreator && handleToggleAssignee(member)}
                          disabled={!isCreator}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            assigned
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : isCreator ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[8px] flex items-center justify-center font-bold">
                            {(member.name || member.email || '?').charAt(0).toUpperCase()}
                          </span>
                          {member.name || member.email}
                          {assigned && <span className="text-blue-500 ml-0.5">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">{isCreator ? 'Invite members from the Team panel to assign them' : 'No members to display'}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                <textarea
                  value={description}
                  onChange={e => isCreator && setDescription(e.target.value)}
                  onBlur={isCreator ? saveCard : undefined}
                  disabled={!isCreator}
                  placeholder={isCreator ? "Add a description..." : "Description not editable"}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Attachments */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attachments</h4>
                {card.attachments && card.attachments.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {card.attachments.map((att, idx) => {
                      const fileType = getFileIcon(att.fileName);
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 hover:border-gray-300 transition-colors group">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(fileType)} bg-white border border-gray-200`}>
                            {fileType === 'image' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : fileType === 'pdf' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <a
                            href={getFullUrl(att.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-blue-600 text-sm flex-1 truncate font-medium"
                          >
                            {att.fileName}
                          </a>
                          <span className="text-xs text-gray-400">{formatFileSize(att.fileSize)}</span>
                          {isCreator && (
                          <button
                            onClick={() => handleDeleteAttachment(idx)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded transition-all"
                            title="Remove attachment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">No attachments</p>
                )}
                {isCreator && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-xs text-gray-500 mb-2">{isDragging ? 'Drop files here' : 'Drag & drop files here or click to browse'}</p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white cursor-pointer transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Choose Files
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs text-gray-500">Uploading files...</span>
                  </div>
                )}
              </div>

              {/* Archive / Delete */}
              <div className="border-t pt-4 flex gap-3">
                {isCreator && (
                <button onClick={handleArchive} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archive
                </button>
                )}
                {card.createdBy === currentUserId && (
                  <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700">Checklist</h4>
                {totalSubtasks > 0 && (
                  <span className="text-xs text-gray-500">{subtaskProgress}% complete</span>
                )}
              </div>
              {totalSubtasks > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      subtaskProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
              )}
              <div className="space-y-1.5 mb-4">
                {card.subtasks?.map(sub => (
                  <div key={sub._id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => isCreator && handleToggleSubtask(sub._id)}
                      disabled={!isCreator}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        sub.completed
                          ? 'bg-green-500 border-green-500'
                          : isCreator ? 'border-gray-300 hover:border-blue-500' : 'border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {sub.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {sub.title}
                    </span>
                    {isCreator && (
                      <button
                        onClick={() => handleRemoveSubtask(sub._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isCreator && (
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  value={subtaskTitle}
                  onChange={e => setSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!subtaskTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </form>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Comments</h4>
              <div className="space-y-4 mb-6">
                {card.comments?.length > 0 ? (
                  card.comments.map((comment, idx) => (
                    <div key={comment._id || idx} className="flex gap-3">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                        {(comment.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">{comment.name}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                          {(comment.userId === currentUserId) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-gray-300 hover:text-red-500 text-xs ml-auto transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No comments yet</p>
                )}
              </div>
              {isCreator && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </form>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Activity</h4>
              <p className="text-sm text-gray-400">Activity log coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardModal;
