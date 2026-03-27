import React from 'react'
interface Props { label: string; value: string | number; icon: string; color?: string; sub?: string }
export default function StatCard({ label, value, icon, color = 'blue', sub }: Props) {
  const colors: Record<string, string> = {
    blue: 'border-blue-700 bg-blue-900/20',
    red: 'border-red-700 bg-red-900/20',
    green: 'border-green-700 bg-green-900/20',
    yellow: 'border-yellow-700 bg-yellow-900/20',
    gold: 'border-yellow-600 bg-yellow-900/20',
  }
  return (
    <div className={`card border ${colors[color] || colors.blue}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</div>
          <div className="text-3xl font-bold text-white">{value}</div>
          {sub && <div className="text-gray-400 text-xs mt-1">{sub}</div>}
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
    </div>
  )
}
