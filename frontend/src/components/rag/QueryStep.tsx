import StepCard from './StepCard';
import { QueryStepProps } from '../../types';

export default function QueryStep({ query }: QueryStepProps) {
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  return (
    <StepCard
      step={1}
      title="用户问题"
      status={hasQuery ? 'done' : 'pending'}
    >
      {hasQuery && (
        <div className="mt-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          {trimmed}
        </div>
      )}
      {!hasQuery && (
        <p className="mt-2 text-xs text-gray-400">
          等待输入提问后开始 RAG 流程。
        </p>
      )}
    </StepCard>
  );
}
