export default function StepCard({ step, title, status, children }) {
  const statusConfig = {
    pending: {
      bg: 'bg-gray-100',
      border: 'border-gray-200',
      icon: 'text-gray-400',
      title: 'text-gray-500'
    },
    processing: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-700'
    },
    done: {
      bg: 'bg-white',
      border: 'border-green-200',
      icon: 'text-green-500',
      title: 'text-gray-700'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-2">
        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
          status === 'done' ? 'bg-green-100 text-green-600' :
          status === 'processing' ? 'bg-blue-100 text-blue-600' :
          'bg-gray-200 text-gray-500'
        }`}>
          {status === 'done' ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : status === 'processing' ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            step
          )}
        </span>
        <span className={`text-sm font-medium ${config.title}`}>{title}</span>
      </div>
      {children}
    </div>
  );
}
