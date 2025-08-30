const activities = [
  {
    id: 1,
    type: 'user',
    message: 'New user registered',
    time: '2 minutes ago',
    icon: '👤',
  },
  {
    id: 2,
    type: 'system',
    message: 'Database backup completed',
    time: '1 hour ago',
    icon: '💾',
  },
  {
    id: 3,
    type: 'alert',
    message: 'High memory usage detected',
    time: '3 hours ago',
    icon: '⚠️',
  },
  {
    id: 4,
    type: 'success',
    message: 'Deployment successful',
    time: '5 hours ago',
    icon: '✅',
  },
  {
    id: 5,
    type: 'info',
    message: 'Weekly report generated',
    time: '1 day ago',
    icon: '📊',
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-lg">{activity.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {activity.message}
            </p>
            <p className="text-xs text-gray-500">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
      
      <div className="pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  )
}
