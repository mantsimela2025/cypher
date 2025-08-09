import React, { useState, useRef, useEffect } from 'react';

/**
 * OptimizedImage Component with lazy loading and performance optimizations
 * 
 * Features:
 * - Lazy loading with intersection observer
 * - WebP format support with fallback
 * - Loading states and error handling
 * - Responsive images with srcSet
 * - Fade-in animation on load
 */
const OptimizedImage = ({
  src,
  webpSrc,
  alt,
  className = '',
  style = {},
  loading = 'lazy',
  sizes,
  srcSet,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || loading !== 'lazy') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
      }
    );

    observer.observe(img);

    return () => {
      if (img) {
        observer.unobserve(img);
      }
    };
  }, [loading]);

  const handleLoad = (event) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event) => {
    setHasError(true);
    if (onError) {
      onError(event);
    }
  };

  const imageStyle = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    ...style,
  };

  const shouldShowImage = loading === 'eager' || isInView;

  return (
    <div ref={imgRef} className={`optimized-image-container ${className}`} style={{ position: 'relative' }}>
      {!isLoaded && shouldShowImage && (
        <img
          src={placeholder}
          alt=""
          className="placeholder-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(2px)',
            zIndex: 1,
          }}
        />
      )}
      
      {shouldShowImage && !hasError && (
        <picture>
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            style={imageStyle}
            className="main-image"
            {...props}
          />
        </picture>
      )}
      
      {hasError && (
        <div
          className="error-placeholder"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            fontSize: '0.875rem',
            minHeight: '100px',
          }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;