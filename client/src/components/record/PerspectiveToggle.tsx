import React from 'react';
import type { PerspectiveView } from '../../types/record';

interface Props {
  view: PerspectiveView;
  onToggle: (view: PerspectiveView) => void;
}

export const PerspectiveToggle: React.FC<Props> = ({ view, onToggle }) => (
  <div role="tablist" aria-label="Perspective" className="perspective-toggle">
    <button
      role="tab"
      aria-selected={view === 'executive'}
      aria-controls="executive-panel"
      id="tab-executive"
      className={`perspective-tab ${view === 'executive' ? 'perspective-tab--active' : ''}`}
      onClick={() => onToggle('executive')}
    >
      Executive View
    </button>
    <button
      role="tab"
      aria-selected={view === 'technical'}
      aria-controls="technical-panel"
      id="tab-technical"
      className={`perspective-tab ${view === 'technical' ? 'perspective-tab--active' : ''}`}
      onClick={() => onToggle('technical')}
    >
      Technical View
    </button>
  </div>
);
