import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, CheckCircle, Loader2, Shield, Wrench, Terminal } from 'lucide-react';
import clsx from 'clsx';

interface SmartRepairModalProps {
  onClose: () => void;
}

// Rust 侧的真实结构
interface RepairSuggestion {
  id: string;
  title: string;
  description: string;
  command: string | null;
  risk_level: string;
  auto_fixable: boolean;
}

interface GatewayRepairResult {
  success: boolean;
  diagnosis_summary: string;
  ai_analysis: string;
  suggested_fixes: RepairSuggestion[];
  raw_diagnosis: string;
  error: string | null;
}

type RepairState = 'idle' | 'analyzing' | 'ready' | 'executing' | 'done' | 'error';

export function SmartRepairModal({ onClose }: SmartRepairModalProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<RepairState>('idle');
  const [result, setResult] = useState<GatewayRepairResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [executeIndex, setExecuteIndex] = useState<number | null>(null);
  const [executeResult, setExecuteResult] = useState<string | null>(null);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setState('analyzing');
    try {
      const data = await invoke<GatewayRepairResult>('run_gateway_repair');
      setResult(data);
      setState('ready');
    } catch (e) {
      setResult({ success: false, diagnosis_summary: '', ai_analysis: '', suggested_fixes: [], raw_diagnosis: '', error: String(e) });
      setState('error');
    }
  };

  const handleExecute = async (suggestion: RepairSuggestion, index: number) => {
    if (!suggestion.command) return;
    setExecuteIndex(index);
    setState('executing');
    setExecuteResult(null);
    try {
      const res = await invoke<string>('execute_repair_command', { command_to_run: suggestion.command });
      setExecuteResult(res);
      setState('done');
    } catch (e) {
      setExecuteResult(String(e));
      setState('error');
    }
  };

  const getStatusIcon = () => {
    if (!result) return <Loader2 className="animate-spin" size={20} />;
    return result.success ? <CheckCircle size={20} className="text-green-400" /> : <AlertTriangle size={20} className="text-yellow-400" />;
  };

  const getStatusLabel = () => {
    if (!result) return '';
    return result.success ? t('smartRepair.statusOk') : (result.error ? t('smartRepair.statusError') : t('smartRepair.statusWarning'));
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-surface-elevated text-content-secondary border-edge';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-surface-card rounded-2xl border border-edge shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-b border-edge">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <Wrench size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content-primary">{t('smartRepair.title')}</h2>
              <p className="text-sm text-content-secondary">{t('smartRepair.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated text-content-tertiary hover:text-content-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-surface-elevated rounded-xl border border-edge">
            {state === 'analyzing' ? <Loader2 size={20} className="text-purple-400 animate-spin" /> : getStatusIcon()}
            <span className={clsx('font-medium', state === 'analyzing' ? 'text-purple-400' : result?.success ? 'text-green-400' : 'text-yellow-400')}>
              {state === 'analyzing' ? t('smartRepair.analyzing') : getStatusLabel()}
            </span>
          </div>

          {/* Summary */}
          {result && result.diagnosis_summary && (
            <div className="p-4 bg-surface-elevated rounded-xl border border-edge">
              <h3 className="text-sm font-medium text-content-primary mb-2">{t('smartRepair.summary')}</h3>
              <p className="text-sm text-content-secondary leading-relaxed">{result.diagnosis_summary}</p>
            </div>
          )}

          {/* AI Analysis */}
          {result && result.ai_analysis && (
            <div className="p-4 bg-surface-elevated rounded-xl border border-edge">
              <h3 className="text-sm font-medium text-content-primary mb-2">{t('smartRepair.analysis')}</h3>
              <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap">{result.ai_analysis}</p>
            </div>
          )}

          {/* Suggestions */}
          {result && result.suggested_fixes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-content-primary">{t('smartRepair.suggestions')}</h3>
              {result.suggested_fixes.map((suggestion, index) => (
                <div key={suggestion.id} className="p-4 bg-surface-elevated rounded-xl border border-edge hover:border-purple-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', getRiskBadgeColor(suggestion.risk_level))}>
                          <Shield size={10} />
                          {t(`smartRepair.risk${suggestion.risk_level.charAt(0).toUpperCase() + suggestion.risk_level.slice(1).toLowerCase()}`)}
                        </span>
                        {suggestion.auto_fixable && (
                          <span className="text-xs text-green-400">✓ {t('smartRepair.autoFixable')}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-content-primary mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-content-secondary mb-2">{suggestion.description}</p>
                      {suggestion.command && (
                        <code className="block text-xs text-purple-400 bg-purple-500/10 px-3 py-2 rounded-lg font-mono overflow-x-auto">
                          {suggestion.command}
                        </code>
                      )}
                    </div>
                    {suggestion.command && (
                      <button
                        onClick={() => handleExecute(suggestion, index)}
                        disabled={state === 'executing'}
                        className="flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {state === 'executing' && executeIndex === index ? <Loader2 size={14} className="animate-spin" /> : t('smartRepair.execute')}
                      </button>
                    )}
                  </div>
                  {state === 'executing' && executeIndex === index && (
                    <div className="mt-3 p-3 bg-surface-card rounded-lg border border-edge flex items-center gap-2">
                      <Loader2 size={14} className="text-purple-400 animate-spin" />
                      <span className="text-xs text-content-tertiary">{t('smartRepair.executing')}</span>
                    </div>
                  )}
                  {state === 'done' && executeIndex === index && executeResult && (
                    <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-xs font-medium text-green-400">{t('smartRepair.success')}</span>
                      </div>
                      <p className="text-sm text-green-300 font-mono whitespace-pre-wrap">{executeResult}</p>
                    </div>
                  )}
                  {state === 'error' && executeIndex === index && executeResult && (
                    <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-xs font-medium text-red-400">{t('smartRepair.failed')}</span>
                      </div>
                      <p className="text-sm text-red-300">{executeResult}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {state === 'error' && result?.error && (
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          )}

          {/* Raw Diagnosis (toggle) */}
          {result && result.raw_diagnosis && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                <Terminal size={14} />
                {showDetails ? t('smartRepair.hideDetails') : t('smartRepair.showDetails')}
              </button>
              {showDetails && (
                <pre className="mt-2 p-4 bg-surface-sidebar rounded-xl text-xs text-content-tertiary font-mono overflow-x-auto whitespace-pre-wrap">
                  {result.raw_diagnosis}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-elevated border-t border-edge">
          <button onClick={runAnalysis} className="px-4 py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors">
            {t('smartRepair.refresh')}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}