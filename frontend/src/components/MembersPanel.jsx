import { useState } from 'react';
import { addMember, removeMember } from '../services/memberService';

function MembersPanel({ board, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!board) return null;

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) return;

    try {
      await addMember(board._id, email);
      setEmail('');
      setSuccess('Member added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error adding member';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMember(board._id, userId);
      onClose(true);
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Team Members</h2>
            <button
              onClick={() => onClose()}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Current Members</p>
            {board.members?.length > 0 ? (
              <div className="space-y-2">
                {board.members.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{member.name || member.email}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-500 text-xs hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No members</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Add Member</h3>
            <form onSubmit={handleAddMember}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              {success && <p className="text-green-500 text-xs mt-1">{success}</p>}
              <button
                type="submit"
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Add Member
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembersPanel;
