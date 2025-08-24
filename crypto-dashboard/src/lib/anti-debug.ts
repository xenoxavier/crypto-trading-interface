// Anti-debugging and view source protection utilities
'use client';

class AntiDebugManager {
  private static instance: AntiDebugManager;
  private protectionEnabled = true;
  private intervalIds: NodeJS.Timeout[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initProtection();
    }
  }

  static getInstance(): AntiDebugManager {
    if (!AntiDebugManager.instance) {
      AntiDebugManager.instance = new AntiDebugManager();
    }
    return AntiDebugManager.instance;
  }

  private initProtection(): void {
    // Console warning
    this.addConsoleWarning();
    
    // Context menu disable
    this.disableContextMenu();
    
    // Key combination disable
    this.disableKeyboardShortcuts();
    
    // Developer tools detection
    this.detectDevTools();
    
    // DOM manipulation protection
    this.protectDOMManipulation();
    
    // Source code obfuscation
    this.obfuscateSourceCode();
  }

  private addConsoleWarning(): void {
    const style = [
      'color: red',
      'background: yellow',
      'font-size: 20px',
      'font-weight: bold',
      'padding: 10px',
      'border: 3px solid red'
    ].join(';');

    console.log('%c⚠️ SECURITY WARNING ⚠️', style);
    console.log('%cThis is a crypto trading application. Unauthorized access or tampering is prohibited.', 'color: red; font-size: 16px;');
    console.log('%cIf you are not authorized to access this console, please close it immediately.', 'color: red; font-size: 14px;');
  }

  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  private disableKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'S')
      ) {
        e.preventDefault();
        e.stopPropagation();
        this.showWarningMessage();
        return false;
      }
    });
  }

  private detectDevTools(): void {
    const detection = () => {
      const start = performance.now();
      debugger; // This will cause a pause if dev tools are open
      const end = performance.now();
      
      if (end - start > 100) {
        this.handleDevToolsDetected();
      }
    };

    // Check every 1 second
    const intervalId = setInterval(detection, 1000);
    this.intervalIds.push(intervalId);

    // Alternative detection method - console.log timing
    let devtools = false;
    const checkDevTools = () => {
      const before = new Date().getTime();
      console.clear();
      const after = new Date().getTime();
      if (after - before > 100) {
        if (!devtools) {
          devtools = true;
          this.handleDevToolsDetected();
        }
      } else {
        devtools = false;
      }
    };

    const intervalId2 = setInterval(checkDevTools, 500);
    this.intervalIds.push(intervalId2);
  }

  private handleDevToolsDetected(): void {
    if (!this.protectionEnabled) return;

    // Blur the page content
    document.body.style.filter = 'blur(5px)';
    document.body.style.pointerEvents = 'none';

    // Show warning overlay
    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div>
          <h1 style="color: red; font-size: 3em; margin-bottom: 20px;">⚠️ UNAUTHORIZED ACCESS DETECTED ⚠️</h1>
          <p style="font-size: 1.5em; margin-bottom: 20px;">Developer tools detected. Please close them to continue.</p>
          <p style="font-size: 1.2em;">This application contains sensitive financial data.</p>
          <button onclick="location.reload()" style="
            background: #ff4444;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.2em;
            cursor: pointer;
            border-radius: 5px;
            margin-top: 20px;
          ">Reload Page</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Clear sensitive data from memory
    this.clearSensitiveData();
  }

  private protectDOMManipulation(): void {
    // Freeze important objects
    if (typeof Object.freeze === 'function') {
      Object.freeze(console);
      Object.freeze(console.log);
      Object.freeze(console.clear);
    }

    // Monitor DOM mutations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              // Check for suspicious script injections
              const scripts = node.querySelectorAll('script');
              if (scripts.length > 0) {
                console.warn('Suspicious script injection detected');
                // Remove injected scripts
                scripts.forEach(script => script.remove());
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  private obfuscateSourceCode(): void {
    // Add random comments and whitespace to make source code harder to read
    const addNoise = () => {
      const script = document.createElement('script');
      script.innerHTML = `
        // ${Math.random().toString(36).substring(2, 15)}
        /* ${Math.random().toString(36).substring(2, 15)} */
        var _0x${Math.random().toString(36).substring(2, 8)} = '${Math.random().toString(36).substring(2, 15)}';
      `;
      document.head.appendChild(script);
    };

    // Add noise periodically
    const intervalId = setInterval(addNoise, 5000);
    this.intervalIds.push(intervalId);
  }

  private showWarningMessage(): void {
    const toast = document.createElement('div');
    toast.innerHTML = '⚠️ Action blocked for security reasons';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 999999;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private clearSensitiveData(): void {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('portfolio') || key.includes('trading') || key.includes('enc_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any sensitive variables in window object
    if (typeof window !== 'undefined') {
      const sensitiveKeys = Object.keys(window).filter(key => 
        key.includes('portfolio') || 
        key.includes('trading') || 
        key.includes('crypto')
      );
      sensitiveKeys.forEach(key => {
        try {
          // @ts-ignore
          delete window[key];
        } catch (e) {
          // Ignore errors
        }
      });
    }
  }

  // Disable protection for development
  disableProtection(): void {
    this.protectionEnabled = false;
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
  }

  // Enable protection
  enableProtection(): void {
    this.protectionEnabled = true;
    this.initProtection();
  }

  // Check if running in development mode
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }
}

// Initialize anti-debug protection
export const initAntiDebug = () => {
  if (typeof window !== 'undefined') {
    const antiDebug = AntiDebugManager.getInstance();
    
    // Disable in development mode
    if (antiDebug.isDevelopment()) {
      console.log('🔧 Anti-debug protection disabled in development mode');
      antiDebug.disableProtection();
    }
    
    return antiDebug;
  }
};

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAntiDebug);
  } else {
    initAntiDebug();
  }
}