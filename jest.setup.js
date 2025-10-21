import '@testing-library/jest-dom'

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock remark-gfm
jest.mock('remark-gfm', () => {
  return jest.fn()
})

// Mock react-markdown with component support
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children, components }) {
    if (typeof children === 'string') {
      // Check for code blocks
      const codeBlockMatch = children.match(/```(\w+)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        const lang = codeBlockMatch[1] || '';
        const code = codeBlockMatch[2];

        // Use custom code component if provided
        if (components && components.code) {
          const CodeComponent = components.code;
          return (
            <CodeComponent
              inline={false}
              className={`language-${lang}`}
              children={code}
            />
          );
        }

        return (
          <div>
            <pre>
              <code className={`language-${lang}`}>{code}</code>
            </pre>
          </div>
        );
      }

      // Check for inline code
      const inlineCodeMatch = children.match(/`([^`]+)`/);
      if (inlineCodeMatch) {
        const parts = children.split(/`([^`]+)`/);

        return (
          <div>
            {parts.map((part, i) => {
              if (i % 2 === 1) {
                if (components && components.code) {
                  const CodeComponent = components.code;
                  return (
                    <CodeComponent
                      key={i}
                      inline={true}
                      children={part}
                    />
                  );
                }
                return <code key={i}>{part}</code>;
              }
              return part;
            })}
          </div>
        );
      }

      // Check for bold and italic (process both if present)
      const hasBold = children.match(/\*\*([^*]+)\*\*/);
      const hasItalic = children.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

      if (hasBold || hasItalic) {
        let result = children;
        const elements = [];

        // Process by splitting on both patterns
        const parts = children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);

        return (
          <div>
            {parts.map((part, i) => {
              if (part.match(/^\*\*([^*]+)\*\*$/)) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              } else if (part.match(/^\*([^*]+)\*$/)) {
                return <em key={i}>{part.slice(1, -1)}</em>;
              }
              return part;
            })}
          </div>
        );
      }
    }

    return <div>{children}</div>
  }
})

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}))

jest.mock('react-syntax-highlighter', () => ({
  Prism: function Prism({ children }) {
    return <pre>{children}</pre>
  },
}))

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock TextEncoder and TextDecoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array([...str].map(c => c.charCodeAt(0)));
  }
};

global.TextDecoder = class TextDecoder {
  decode(arr) {
    return String.fromCharCode(...new Uint8Array(arr));
  }
};

// Mock ReadableStream for streaming tests
global.ReadableStream = class ReadableStream {
  constructor(underlyingSource) {
    this.underlyingSource = underlyingSource;
  }

  getReader() {
    const source = this.underlyingSource;
    let started = false;

    return {
      read: async function() {
        if (!started) {
          started = true;
          if (source && source.start) {
            const controller = {
              enqueue: (chunk) => { this._chunk = chunk; },
              close: () => { this._closed = true; }
            };
            source.start(controller);

            if (this._chunk) {
              const chunk = this._chunk;
              delete this._chunk;
              return { done: false, value: chunk };
            }
          }
        }
        return { done: true, value: undefined };
      }
    };
  }
};

// Mock Headers for edge runtime
global.Headers = class Headers {
  constructor(init) {
    this.headers = {};
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers[key.toLowerCase()] = value;
      });
    }
  }

  get(name) {
    return this.headers[name.toLowerCase()] || null;
  }

  set(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  has(name) {
    return name.toLowerCase() in this.headers;
  }

  append(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  entries() {
    return Object.entries(this.headers);
  }

  keys() {
    return Object.keys(this.headers);
  }

  values() {
    return Object.values(this.headers);
  }

  forEach(callback) {
    Object.entries(this.headers).forEach(([key, value]) => callback(value, key, this));
  }
};

// Mock Request for edge runtime
global.Request = class Request {
  constructor(url, init = {}) {
    this._url = url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this._bodyText = init.body;
  }

  get url() {
    return this._url;
  }

  async json() {
    return JSON.parse(this._bodyText);
  }

  async text() {
    return this._bodyText;
  }
};

// Mock Response for edge runtime
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  async text() {
    if (typeof this.body === 'string') {
      return this.body;
    }
    if (this.body instanceof ReadableStream) {
      return '[Stream]';
    }
    return String(this.body);
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
};
