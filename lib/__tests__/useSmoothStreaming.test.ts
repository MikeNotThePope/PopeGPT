import { renderHook, act, waitFor } from '@testing-library/react';
import { useSmoothStreaming } from '@/lib/useSmoothStreaming';

describe('useSmoothStreaming', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should accumulate chunks in buffer', () => {
    const onUpdate = jest.fn();
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useSmoothStreaming({
        charsPerSecond: 1000, // Fast for testing
        onUpdate,
        onComplete,
      })
    );

    // Add a chunk
    act(() => {
      result.current.addChunk('Hello');
    });

    // The buffer should have the chunk
    // onUpdate should be called (via requestAnimationFrame)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should have called onUpdate with some portion of the text
    expect(onUpdate).toHaveBeenCalled();
  });

  test('should preserve prefix when adding initial chunk', () => {
    const displayedTexts: string[] = [];
    const onUpdate = jest.fn((text: string) => {
      displayedTexts.push(text);
    });
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useSmoothStreaming({
        charsPerSecond: 1000,
        onUpdate,
        onComplete,
      })
    );

    // Add initial chunk with prefix
    act(() => {
      result.current.addChunk("Okay, I understand you like cheese");
    });

    // Advance time to allow rendering
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Check that onUpdate was called
    expect(onUpdate).toHaveBeenCalled();

    // Check that at least some text from the beginning is displayed
    const lastDisplayedText = displayedTexts[displayedTexts.length - 1];

    // The displayed text should start with the beginning of the message, not skip the prefix
    expect(lastDisplayedText).toMatch(/^Okay/);
  });

  test('should append new chunks to existing buffer', () => {
    const displayedTexts: string[] = [];
    const onUpdate = jest.fn((text: string) => {
      displayedTexts.push(text);
    });
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useSmoothStreaming({
        charsPerSecond: 1000,
        onUpdate,
        onComplete,
      })
    );

    // Add first chunk
    act(() => {
      result.current.addChunk("Okay, I understand");
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Add second chunk
    act(() => {
      result.current.addChunk(" you like cheese");
    });

    // Advance time to render more
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onUpdate).toHaveBeenCalled();

    // The final displayed text should contain both chunks
    const lastDisplayedText = displayedTexts[displayedTexts.length - 1];

    // Should have content from both chunks
    expect(lastDisplayedText).toContain("Okay");
    expect(lastDisplayedText).toContain("understand");
  });

  test('should call onComplete when finishStreaming is called', () => {
    const onUpdate = jest.fn();
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useSmoothStreaming({
        charsPerSecond: 100,
        onUpdate,
        onComplete,
      })
    );

    // Add chunk
    act(() => {
      result.current.addChunk("Hello");
    });

    // Signal completion
    act(() => {
      result.current.finishStreaming();
    });

    // Advance time to finish rendering
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  test('should reset buffer when reset is called', () => {
    const onUpdate = jest.fn();
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useSmoothStreaming({
        charsPerSecond: 1000,
        onUpdate,
        onComplete,
      })
    );

    // Add chunk
    act(() => {
      result.current.addChunk("Hello");
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    const callsBeforeReset = onUpdate.mock.calls.length;

    // Reset
    act(() => {
      result.current.reset();
    });

    // Add new chunk after reset
    act(() => {
      result.current.addChunk("World");
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    // onUpdate should have been called again after reset
    expect(onUpdate.mock.calls.length).toBeGreaterThan(callsBeforeReset);

    // The new text should be "World", not include "Hello"
    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCall).not.toContain("Hello");
  });
});
