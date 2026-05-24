import Logo from './Logo';

function HomePage({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="px-4 sm:px-6 lg:px-8 py-3 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-white text-lg font-bold tracking-tight">Task Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16 animate-float" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Organize your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              tasks
            </span>
            , collaborate in real-time
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A powerful Kanban board to manage projects, track progress, and work together with your team — all in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-base font-semibold transition-colors shadow-lg shadow-blue-600/25"
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Kanban Boards</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Create boards, lists, and cards to organize your workflow visually with drag-and-drop.</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Team Collaboration</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Invite team members, assign tasks, and see who's online — all in real time.</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Real-Time Updates</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Every change syncs instantly. See card moves, comments, and notifications as they happen.</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Labels & Filters</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Color-code cards with labels and filter your board to focus on what matters.</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">File Attachments</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Attach images and files to cards. Everything stays organized and accessible.</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Due Dates & Reminders</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Set deadlines, get notified, and never miss a due date again.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">Task Manager — Kanban Board &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
