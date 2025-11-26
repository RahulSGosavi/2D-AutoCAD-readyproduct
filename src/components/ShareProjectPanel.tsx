import { useState } from 'react';
import { shareLinkService } from '../services/projects/shareLinkService';
import { useEditorStore } from '../state/useEditorStore';

const ShareProjectPanel = () => {
  const layers = useEditorStore((state) => state.layers);
  const elements = useEditorStore((state) => state.elements);
  const activeLayerId = useEditorStore((state) => state.activeLayerId);
  const [notes, setNotes] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const link = shareLinkService.createLink({ layers, elements, activeLayerId, notes });
    setShareLink(link);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
  };

  return (
    <div className="rounded border border-outline bg-surface-sunken p-4 flex flex-col gap-3 text-xs">
      <div>
        <p className="text-sm font-semibold text-slate-200">Share Project</p>
        <p className="text-[11px] text-slate-400">Generate a sharable link with optional notes.</p>
      </div>
      <textarea
        className="rounded border border-outline bg-surface px-2 py-1 text-xs"
        placeholder="Add review notes or instructions..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <button className="rounded border border-accent text-accent px-2 py-2 text-xs hover:bg-accent/10" onClick={handleGenerate}>
        Generate Link
      </button>
      {shareLink && (
        <div className="flex flex-col gap-2">
          <input type="text" readOnly value={shareLink} className="rounded border border-outline bg-surface px-2 py-1 text-[11px]" />
          <button className="rounded border border-outline px-2 py-1 text-[11px] hover:border-accent" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareProjectPanel;

