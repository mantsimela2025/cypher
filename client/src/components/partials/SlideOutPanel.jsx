import React, { useEffect } from "react";
import { Icon } from "@/components/Component";
import "./SlideOutPanel.css";

const SlideOutPanel = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = "1200px",
  showBackdrop = true 
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div 
          className="slideout-backdrop"
          onClick={onClose}
        />
      )}
      
      {/* Slide-out Panel */}
      <div 
        className={`slideout-panel ${isOpen ? 'slideout-panel-open' : ''}`}
        style={{ width }}
      >
        {/* Header */}
        <div className="slideout-header">
          <h5 className="slideout-title">
            {title}
          </h5>
          <button
            type="button"
            className="slideout-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="cross"></Icon>
          </button>
        </div>
        
        {/* Content */}
        <div className="slideout-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default SlideOutPanel;
