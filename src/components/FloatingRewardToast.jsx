import { Sparkles } from 'lucide-react';

export default function FloatingRewardToast({ toast }) {
  if (!toast) return null;
  return (
    <div key={toast.id} className="floating-reward-toast" role="status" aria-live="polite">
      <Sparkles size={16} />
      <span>{toast.text}</span>
    </div>
  );
}
