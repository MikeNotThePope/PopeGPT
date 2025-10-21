import { useRef, useCallback, useEffect } from 'react';

interface SmoothStreamingOptions {
  /**
   * Characters per second to display (default: 80)
   * Higher = faster typing effect
   */
  charsPerSecond?: number;

  /**
   * Callback when text updates (for scroll-to-bottom, etc.)
   */
  onUpdate?: (displayedText: string) => void;

  /**
   * Callback when streaming completes
   */
  onComplete?: (finalText: string) => void;
}

export function useSmoothStreaming(options: SmoothStreamingOptions = {}) {
  const {
    charsPerSecond = 80,
    onUpdate,
    onComplete,
  } = options;

  // Text buffers
  const fullTextBuffer = useRef<string>(''); // All text received from server
  const displayedText = useRef<string>(''); // Text currently shown to user
  const displayIndex = useRef<number>(0); // Current position in fullTextBuffer

  // Animation state
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const isStreamingActive = useRef<boolean>(false);
  const isComplete = useRef<boolean>(false);

  // Store callbacks in refs to avoid recreating animate function
  const onUpdateRef = useRef(onUpdate);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Calculate how many chars to add per frame for smooth animation
  const charsPerFrame = charsPerSecond / 60; // Assuming 60 FPS

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    // Reset streaming state so animation can restart after cleanup
    isStreamingActive.current = false;
  }, []);

  // Animation loop - renders text smoothly character by character
  const animate = useCallback((currentTime: number) => {
    if (!isStreamingActive.current) {
      return;
    }

    // Initialize on first frame
    if (lastFrameTime.current === 0) {
      lastFrameTime.current = currentTime;
    }

    const deltaTime = currentTime - lastFrameTime.current;
    lastFrameTime.current = currentTime;

    // Calculate how many characters to add this frame
    // Using deltaTime to account for variable frame rates
    // Cap at 5 chars per frame to prevent jumps
    const charsToAdd = Math.max(1, Math.min(5, Math.floor((deltaTime / 1000) * charsPerSecond)));

    // Update display if we have more text to show
    if (displayIndex.current < fullTextBuffer.current.length) {
      const newIndex = Math.min(
        displayIndex.current + charsToAdd,
        fullTextBuffer.current.length
      );

      displayIndex.current = newIndex;
      displayedText.current = fullTextBuffer.current.slice(0, newIndex);

      // Trigger update callback for DOM manipulation
      if (onUpdateRef.current) {
        onUpdateRef.current(displayedText.current);
      }

      // Continue animation
      animationFrameId.current = requestAnimationFrame(animate);
    } else if (isComplete.current) {
      // Streaming is complete and we've displayed all text
      cleanup();
      isStreamingActive.current = false;

      if (onCompleteRef.current) {
        onCompleteRef.current(displayedText.current);
      }
    } else {
      // Waiting for more chunks - keep animating
      animationFrameId.current = requestAnimationFrame(animate);
    }
  }, [charsPerSecond, cleanup]);

  // Add incoming chunk to buffer
  const addChunk = useCallback((chunk: string) => {
    fullTextBuffer.current += chunk;

    // Start or restart animation if not running (handles Strict Mode remounts)
    if (!isStreamingActive.current || animationFrameId.current === null) {
      isStreamingActive.current = true;
      lastFrameTime.current = 0;
      animationFrameId.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Signal that streaming is complete
  const finishStreaming = useCallback(() => {
    isComplete.current = true;

    // If animation is not running but we have remaining text, start it
    if (!isStreamingActive.current && displayIndex.current < fullTextBuffer.current.length) {
      isStreamingActive.current = true;
      lastFrameTime.current = 0;
      animationFrameId.current = requestAnimationFrame(animate);
    }
    // If all text is already displayed and animation is not running, complete immediately
    else if (!isStreamingActive.current && displayIndex.current >= fullTextBuffer.current.length) {
      displayedText.current = fullTextBuffer.current;

      if (onUpdateRef.current) {
        onUpdateRef.current(displayedText.current);
      }

      if (onCompleteRef.current) {
        onCompleteRef.current(displayedText.current);
      }
    }
    // Otherwise animation is running and will complete naturally
  }, [animate]);

  // Reset all state
  const reset = useCallback(() => {
    cleanup();
    fullTextBuffer.current = '';
    displayedText.current = '';
    displayIndex.current = 0;
    isStreamingActive.current = false;
    isComplete.current = false;
    lastFrameTime.current = 0;
  }, [cleanup]);

  // Skip animation and show all text immediately
  const skipToEnd = useCallback(() => {
    cleanup();
    displayedText.current = fullTextBuffer.current;
    displayIndex.current = fullTextBuffer.current.length;
    isStreamingActive.current = false;

    if (onUpdateRef.current) {
      onUpdateRef.current(displayedText.current);
    }

    if (isComplete.current && onCompleteRef.current) {
      onCompleteRef.current(displayedText.current);
    }
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    addChunk,
    finishStreaming,
    reset,
    skipToEnd,
    isActive: () => isStreamingActive.current,
  };
}
