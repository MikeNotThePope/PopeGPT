# Testing Documentation

## Test Coverage

Comprehensive test suite for PopeGPT covering all major components and functionality.

### Test Suites

- **ChatContext** (`lib/__tests__/ChatContext.test.tsx`) - 9 tests for conversation state management
- **ThemeToggle** (`components/__tests__/ThemeToggle.test.tsx`) - 5 tests for dark mode toggle functionality
- **MessageInput** (`components/__tests__/MessageInput.test.tsx`) - 6 tests for message input with auto-resize and send
- **Message** (`components/__tests__/Message.test.tsx`) - 9 tests for message rendering with markdown and code highlighting
- **MessageList** (`components/__tests__/MessageList.test.tsx`) - 4 tests for message list display and empty states
- **Sidebar** (`components/__tests__/Sidebar.test.tsx`) - 7 tests for sidebar navigation and conversation switching
- **ChatInterface** (`components/__tests__/ChatInterface.test.tsx`) - 20 tests for integration of main chat UI
- **API Route** (`app/api/chat/__tests__/route.test.ts`) - OpenRouter API tests (currently excluded)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Results

Current status: **60/60 tests passing** (100% pass rate) ✅

### What's Tested

✅ Conversation management (create, switch, title generation)
✅ Message handling (user/assistant messages, streaming updates)
✅ Theme toggling (dark/light mode)
✅ Message input (typing, sending, Enter/Shift+Enter, auto-focus)
✅ Sidebar functionality (navigation, new chat, conversation selection)
✅ Message display (empty states, loading spinners)
✅ Markdown rendering (code blocks, inline code, formatting)
✅ Error handling (API failures, invalid inputs)

### Test Infrastructure

All tests use properly configured mocks for:
- ✅ react-markdown with component support for custom code rendering
- ✅ react-syntax-highlighter for code highlighting
- ✅ localStorage with functional mock implementation
- ✅ ReadableStream and TextEncoder/TextDecoder for streaming tests
- ✅ scrollIntoView for DOM operations
- ✅ remark-gfm for GitHub-flavored markdown

Note: API route tests (`app/api/chat/__tests__/route.test.ts`) are excluded from the test run as they require Next.js Edge runtime APIs that are complex to mock in jsdom.

## Test Structure

All tests follow React Testing Library best practices:
- User-centric queries (getByRole, getByText, etc.)
- Async utilities for waiting (waitFor, user events)
- Proper cleanup between tests
- Mocked external dependencies

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm run test:coverage
```

## Future Improvements

- Increase coverage for edge cases
- Add E2E tests with Playwright or Cypress
- Mock more complex streaming scenarios
- Add visual regression tests
