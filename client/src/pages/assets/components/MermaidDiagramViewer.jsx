import React, { useEffect, useRef, useState } from 'react';
import { Spinner, Alert } from 'reactstrap';
import { Icon } from "@/components/Component";

const MermaidDiagramViewer = ({ 
  mermaidSyntax, 
  className = '',
  width = '100%',
  height = '400px'
}) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mermaidInstance, setMermaidInstance] = useState(null);

  // Load Mermaid.js dynamically
  useEffect(() => {
    const loadMermaid = async () => {
      try {
        if (!window.mermaid) {
          // Dynamically import mermaid
          const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
          const mermaid = mermaidModule.default;
          
          // Initialize Mermaid with configuration
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            },
            sequence: {
              useMaxWidth: true,
              wrap: true
            },
            gantt: {
              useMaxWidth: true
            }
          });
          
          window.mermaid = mermaid;
          setMermaidInstance(mermaid);
        } else {
          setMermaidInstance(window.mermaid);
        }
      } catch (err) {
        console.error('Failed to load Mermaid:', err);
        setError('Failed to load diagram renderer');
      }
    };

    loadMermaid();
  }, []);

  // Render diagram when mermaid is loaded and syntax is provided
  useEffect(() => {
    if (mermaidInstance && mermaidSyntax && containerRef.current) {
      renderDiagram();
    }
  }, [mermaidInstance, mermaidSyntax]);

  const renderDiagram = async () => {
    if (!mermaidInstance || !mermaidSyntax || !containerRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Generate unique ID for the diagram
      const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a temporary div for mermaid to render into
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = mermaidSyntax;
      
      // Render the diagram
      const { svg, bindFunctions } = await mermaidInstance.render(diagramId, mermaidSyntax);
      
      // Insert the rendered SVG
      containerRef.current.innerHTML = svg;
      
      // Bind any interactive functions if they exist
      if (bindFunctions) {
        bindFunctions(containerRef.current);
      }

      // Style the SVG for responsive behavior
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.display = 'block';
        svgElement.style.margin = '0 auto';
      }

      setLoading(false);
    } catch (err) {
      console.error('Error rendering Mermaid diagram:', err);
      setError(`Failed to render diagram: ${err.message}`);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    renderDiagram();
  };

  if (error) {
    return (
      <div className={`mermaid-viewer-error ${className}`} style={{ minHeight: height }}>
        <Alert color="danger" className="m-3">
          <div className="d-flex align-items-start">
            <Icon name="alert-circle" className="me-2 mt-1"></Icon>
            <div className="flex-grow-1">
              <strong>Diagram Rendering Error</strong>
              <p className="mb-2 mt-1">{error}</p>
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={handleRetry}
              >
                <Icon name="refresh" className="me-1"></Icon>
                Retry
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div 
      className={`mermaid-diagram-viewer ${className}`}
      style={{ 
        width, 
        minHeight: height,
        position: 'relative',
        overflow: 'auto',
        border: '1px solid #ebedf2',
        borderRadius: '8px',
        background: '#ffffff'
      }}
    >
      {loading && (
        <div 
          className="d-flex align-items-center justify-content-center"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10
          }}
        >
          <div className="text-center">
            <Spinner color="primary" className="mb-2" />
            <p className="text-muted">Rendering diagram...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="mermaid-container"
        style={{ 
          padding: '1rem',
          textAlign: 'center',
          minHeight: loading ? height : 'auto'
        }}
      >
        {!mermaidSyntax && !loading && (
          <div className="text-center py-5">
            <Icon name="diagram-3" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
            <p className="text-soft mt-2">No diagram data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MermaidDiagramViewer;