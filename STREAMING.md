# Smooth Streaming Implementation

## Overview

This app implements buttery smooth, ChatGPT-style text streaming using `requestAnimationFrame` and direct DOM manipulation to avoid React re-render overhead during streaming.

## How It Works

### 1. **useSmoothStreaming Hook** (`lib/useSmoothStreaming.ts`)

Custom hook that handles the smooth streaming animation:

- **Buffer Management**: Maintains separate buffers for received text and displayed text
- **requestAnimationFrame Loop**: Syncs character rendering with browser refresh rate (60 FPS)
- **Variable Frame Rate**: Accounts for frame time deltas to maintain consistent speed
- **Character Rate Control**: Configurable `charsPerSecond` (default: 80 characters/second)

**Key Features:**
- `addChunk(chunk)`: Add incoming text to buffer
- `finishStreaming()`: Signal that streaming is complete
- `reset()`: Clear all buffers and state
- `skipToEnd()`: Skip animation and show all text immediately

### 2. **SmoothStreamingText Component** (`components/SmoothStreamingText.tsx`)

React component that uses the hook for smooth text rendering:

- **Direct DOM Manipulation**: Updates text content via `textRef.current.textContent` during streaming (no React re-renders!)
- **Two-Phase Rendering**:
  - **Streaming Phase**: Plain text with direct DOM updates for maximum performance
  - **Complete Phase**: Full markdown rendering after streaming finishes
- **Auto-scroll**: Triggers `onContentChange` callback for smooth scrolling
- **Ref-based API**: Parent components control streaming via `useImperativeHandle`

### 3. **Message Component Updates** (`components/Message.tsx`)

Updated to use smooth streaming for assistant messages:

- Tracks content changes and calculates deltas (new chunks)
- Feeds chunks to `SmoothStreamingText` component
- Handles streaming state transitions
- Optimized `React.memo` that allows re-renders during streaming but prevents them otherwise

### 4. **MessageList Component Updates** (`components/MessageList.tsx`)

Enhanced scrolling behavior:

- `scrollToBottomImmediate()`: Instant scroll during streaming (no smooth behavior for better performance)
- Passes scroll callback to Message components
- Ref-based scroll container for direct scroll manipulation

## Performance Optimizations

### Avoiding React Re-renders During Streaming

1. **Direct DOM Manipulation**: Text content is updated via `textContent` instead of React state
2. **requestAnimationFrame**: Synchronized with browser refresh rate (typically 60 FPS)
3. **Buffer Accumulation**: Chunks are accumulated in a buffer and rendered at a controlled rate
4. **Optimized Memoization**: Message component only re-renders when necessary

### Result

- **Smooth typewriter effect** at ~80 characters/second
- **Minimal CPU usage** during streaming
- **No choppy jumps** or stuttering
- **Auto-scroll** synchronized with text appearance

## Configuration

### Adjust Streaming Speed

In `components/Message.tsx`, modify the `charsPerSecond` prop:

```tsx
<SmoothStreamingText
  ref={smoothStreamingRef}
  messageId={message.id}
  isDark={isDark}
  onContentChange={onContentChange}
  charsPerSecond={80}  // ← Change this value
/>
```

**Recommended values:**
- **40-60**: Slower, more dramatic typewriter effect
- **80-100**: ChatGPT-like speed (default)
- **120-150**: Faster, still smooth
- **200+**: Very fast, less typewriter feel

### Disable Smooth Streaming

To revert to instant text display, simply skip the smooth streaming and show all text immediately in the Message component.

## Architecture Benefits

1. **Decoupled Logic**: Streaming logic separated into reusable hook
2. **Performance**: Direct DOM manipulation avoids React overhead
3. **Smooth UX**: requestAnimationFrame ensures smooth, synchronized rendering
4. **Flexible**: Easy to adjust speed, add skip functionality, or customize behavior
5. **Clean Code**: Component responsibilities are well-separated

## Browser Compatibility

- Modern browsers with `requestAnimationFrame` support (all evergreen browsers)
- Falls back gracefully if animation is skipped or disabled
- Works well on mobile devices with variable refresh rates

## Future Enhancements

Potential improvements:

- **Skip Button**: Allow users to skip the typewriter effect and show all text instantly
- **Speed Control**: User preference for streaming speed
- **Word-by-word**: Alternative animation that reveals whole words instead of characters
- **Pause/Resume**: Ability to pause and resume streaming animation
- **Custom Easing**: Non-linear character reveal (fast start, slow end, etc.)
