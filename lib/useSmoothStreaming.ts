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
    console.log('[cleanup] Called! Cancelling frame ID:', animationFrameId.current);
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
      console.log('[cleanup] Frame cancelled, ID now null');
    }
    // Reset streaming state so animation can restart after cleanup
    isStreamingActive.current = false;
    console.log('[cleanup] isStreamingActive set to false');
  }, []);

  // Animation loop - renders text smoothly character by character
  const animate = useCallback((currentTime: number) => {
    console.log('[animate] Frame at', currentTime, 'isStreamingActive:', isStreamingActive.current);

    if (!isStreamingActive.current) {
      console.log('[animate] Not active, exiting');
      return;
    }

    // Initialize on first frame
    if (lastFrameTime.current === 0) {
      console.log('[animate] First frame, initializing lastFrameTime');
      lastFrameTime.current = currentTime;
    }

    const deltaTime = currentTime - lastFrameTime.current;
    lastFrameTime.current = currentTime;

    console.log('[animate] deltaTime:', deltaTime, 'charsPerSecond:', charsPerSecond);

    // Calculate how many characters to add this frame
    // Using deltaTime to account for variable frame rates
    // Cap at 5 chars per frame to prevent jumps
    const charsToAdd = Math.max(1, Math.min(5, Math.floor((deltaTime / 1000) * charsPerSecond)));

    console.log('[animate] Will add', charsToAdd, 'chars. displayIndex:', displayIndex.current, 'bufferLength:', fullTextBuffer.current.length);

    // Update display if we have more text to show
    if (displayIndex.current < fullTextBuffer.current.length) {
      const newIndex = Math.min(
        displayIndex.current + charsToAdd,
        fullTextBuffer.current.length
      );

      displayIndex.current = newIndex;
      displayedText.current = fullTextBuffer.current.slice(0, newIndex);

      console.log('[animate] Updated display to:', displayedText.current.slice(0, 50) + '...');

      // Trigger update callback for DOM manipulation
      if (onUpdateRef.current) {
        console.log('[animate] Calling onUpdate callback');
        onUpdateRef.current(displayedText.current);
      } else {
        console.log('[animate] WARNING: onUpdate callback is null!');
      }

      // Continue animation
      animationFrameId.current = requestAnimationFrame(animate);
    } else if (isComplete.current) {
      // Streaming is complete and we've displayed all text
      console.log('[animate] Complete! Cleaning up');
      cleanup();
      isStreamingActive.current = false;

      if (onCompleteRef.current) {
        onCompleteRef.current(displayedText.current);
      }
    } else {
      // Waiting for more chunks - keep animating
      console.log('[animate] Waiting for more chunks, continuing animation');
      animationFrameId.current = requestAnimationFrame(animate);
    }
  }, [charsPerSecond, cleanup]);

  // Add incoming chunk to buffer
  const addChunk = useCallback((chunk: string) => {
    console.log('[useSmoothStreaming] addChunk called with:', chunk);
    console.log('[useSmoothStreaming] Buffer before:', fullTextBuffer.current);
    fullTextBuffer.current += chunk;
    console.log('[useSmoothStreaming] Buffer after:', fullTextBuffer.current);

    // Start or restart animation if not running (handles Strict Mode remounts)
    if (!isStreamingActive.current || animationFrameId.current === null) {
      console.log('[useSmoothStreaming] Starting/restarting animation');
      console.log('[useSmoothStreaming] animate function type:', typeof animate);
      console.log('[useSmoothStreaming] animate function:', animate);
      isStreamingActive.current = true;
      lastFrameTime.current = 0;
      const frameId = requestAnimationFrame(animate);
      console.log('[useSmoothStreaming] requestAnimationFrame returned ID:', frameId);
      animationFrameId.current = frameId;

      // Diagnostic: Check if animate gets called within 100ms
      setTimeout(() => {
        console.log('[useSmoothStreaming] DIAGNOSTIC: 100ms passed, isStreamingActive:', isStreamingActive.current);
        console.log('[useSmoothStreaming] DIAGNOSTIC: animationFrameId:', animationFrameId.current);
      }, 100);
    }
  }, [animate]);

  // Signal that streaming is complete
  const finishStreaming = useCallback(() => {
    isComplete.current = true;

    // If animation is not running, trigger completion immediately
    if (!isStreamingActive.current) {
      displayedText.current = fullTextBuffer.current;
      displayIndex.current = fullTextBuffer.current.length;

      if (onUpdateRef.current) {
        onUpdateRef.current(displayedText.current);
      }

      if (onCompleteRef.current) {
        onCompleteRef.current(displayedText.current);
      }
    }
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    console.log('[useSmoothStreaming] RESET called, clearing buffer:', fullTextBuffer.current);
    cleanup();
    fullTextBuffer.current = '';
    displayedText.current = '';
    displayIndex.current = 0;
    isStreamingActive.current = false;
    isComplete.current = false;
    lastFrameTime.current = 0;
    console.log('[useSmoothStreaming] RESET complete');
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
    console.log('[useEffect] Smooth streaming hook mounted/updated');
    return () => {
      console.log('[useEffect cleanup] Component unmounting or cleanup dependency changed');
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
