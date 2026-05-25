import { Play, Square, RotateCcw, Brain, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useState } from 'react';

interface ServiceStatus {
  running: boolean;
  pid: number | null;
  port: number;
}

interface QuickActionsProps {
  status: ServiceStatus | null;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onSmartRepair: () => void;
}

export function QuickActions({
  status,
  loading,
  onStart,
  onStop,
  onRestart,
  onSmartRepair,
}: QuickActionsProps) {
  const { t } = useTranslation();
  const isRunning = status?.running || false;
  const [repairLoading, setRepairLoading] = useState(false);

  const handleSmartRepair = () => {
    setRepairLoading(true);
    onSmartRepair();
    setTimeout(() => setRepairLoading(false), 500);
  };

  return (
    <div className="bg-surface-card rounded-2xl p-6 border border-edge">
      <h3 className="text-lg font-semibold text-content-primary mb-4">{t('quickActions.title')}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 智能分析 - 新增在左侧第一个 */}
        <button
          onClick={handleSmartRepair}
          disabled={loading}
          className={clsx(
            'flex flex-col items-center gap-3 p-4 rounded-xl transition-all',
            'border border-edge',
            'bg-gradient-to-br from-purple-500/10 to-indigo-500/10',
            'hover:from-purple-500/20 hover:to-indigo-500/20',
            'hover:border-purple-500/50'
          )}
        >
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-purple-500/20 to-indigo-500/20'
            )}
          >
            {repairLoading ? (
              <Loader2 size={20} className="text-purple-400 animate-spin" />
            ) : (
              <Brain size={20} className="text-purple-400" />
            )}
          </div>
          <span className="text-sm font-medium text-content-secondary">
            {t('quickActions.smartAnalyze')}
          </span>
        </button>

        {/* 启动 */}
        <button
          onClick={onStart}
          disabled={loading || isRunning}
          className={clsx(
            'flex flex-col items-center gap-3 p-4 rounded-xl transition-all',
            'border border-edge',
            isRunning
              ? 'bg-surface-elevated opacity-50 cursor-not-allowed'
              : 'bg-surface-elevated hover:bg-green-500/20 hover:border-green-500/50'
          )}
        >
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isRunning ? 'bg-surface-elevated' : 'bg-green-500/20'
            )}
          >
            <Play
              size={20}
              className={isRunning ? 'text-content-tertiary' : 'text-green-400'}
            />
          </div>
          <span
            className={clsx(
              'text-sm font-medium',
              isRunning ? 'text-content-tertiary' : 'text-content-secondary'
            )}
          >
            {t('quickActions.start')}
          </span>
        </button>

        {/* 停止 */}
        <button
          onClick={onStop}
          disabled={loading || !isRunning}
          className={clsx(
            'flex flex-col items-center gap-3 p-4 rounded-xl transition-all',
            'border border-edge',
            !isRunning
              ? 'bg-surface-elevated opacity-50 cursor-not-allowed'
              : 'bg-surface-elevated hover:bg-red-500/20 hover:border-red-500/50'
          )}
        >
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              !isRunning ? 'bg-surface-elevated' : 'bg-red-500/20'
            )}
          >
            <Square
              size={20}
              className={!isRunning ? 'text-content-tertiary' : 'text-red-400'}
            />
          </div>
          <span
            className={clsx(
              'text-sm font-medium',
              !isRunning ? 'text-content-tertiary' : 'text-content-secondary'
            )}
          >
            {t('quickActions.stop')}
          </span>
        </button>

        {/* 重启 */}
        <button
          onClick={onRestart}
          disabled={loading}
          className={clsx(
            'flex flex-col items-center gap-3 p-4 rounded-xl transition-all',
            'border border-edge',
            'bg-surface-elevated hover:bg-amber-500/20 hover:border-amber-500/50'
          )}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/20">
            <RotateCcw
              size={20}
              className={clsx('text-amber-400', loading && 'animate-spin')}
            />
          </div>
          <span className="text-sm font-medium text-content-secondary">{t('quickActions.restart')}</span>
        </button>
      </div>
    </div>
  );
}