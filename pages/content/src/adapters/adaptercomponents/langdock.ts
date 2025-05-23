/**
 * LangDock website components for MCP-SuperAssistant
 * 
 * This file implements the toggle buttons for MCP functionality on the LangDock website:
 * 1. MCP ON/OFF toggle
 * 2. Auto Insert toggle
 * 3. Auto Submit toggle
 * 4. Auto Execute toggle
 */

import {
  initializeAdapter,
  AdapterConfig,
  SimpleSiteAdapter
} from './common'; // Import from the common file

// LangDock-specific functions for finding insertion points
function findLangDockButtonInsertionPoint(): { container: Element; insertAfter: Element | null } | null {
  // Look for the buttons container in the LangDock chat interface
  // First try to find the main action buttons container
  const buttonContainer = document.querySelector('div.flex.flex-row.items-center.gap-2');
  if (buttonContainer) {
    console.debug('[LangDock Adapter] Found button container');
    // Try to find a specific button to insert after, like file upload or settings
    const buttons = buttonContainer.querySelectorAll('button');
    
    // Convert NodeListOf to Array to ensure iterator compatibility
    for (const button of Array.from(buttons)) {
      // Look for buttons with SVG icons that might be file upload or settings
      if (button.querySelector('svg')) {
        console.debug('[LangDock Adapter] Found button with icon, will insert after it');
        return { container: buttonContainer, insertAfter: button };
      }
    }
    
    // If no specific button found, fall back to last button
    const lastButton = buttonContainer.querySelector('button:last-child');
    console.debug('[LangDock Adapter] No specific button found, using last button as insertion point');
    return { container: buttonContainer, insertAfter: lastButton };
  }

  // Fallback: Look for the parent of the textarea input
  const textareaParent = document.querySelector('textarea');
  if (textareaParent && textareaParent.parentElement) {
    console.debug('[LangDock Adapter] Found insertion point relative to textarea (fallback)');
    return { container: textareaParent.parentElement, insertAfter: textareaParent };
  }

  // Second fallback: Look for the chat input area container
  const chatInputArea = document.querySelector('div.relative.flex.w-full.flex-col');
  if (chatInputArea) {
    console.debug('[LangDock Adapter] Found insertion point in chat input area (fallback 2)');
    return { container: chatInputArea, insertAfter: null }; // Append to end
  }

  console.warn('[LangDock Adapter] Could not find a suitable insertion point.');
  return null;
}

// LangDock-specific sidebar handling
function showLangDockSidebar(adapter: SimpleSiteAdapter | null): void {
    console.debug('[LangDock Adapter] MCP Enabled - Showing sidebar');
    if (adapter?.showSidebarWithToolOutputs) {
        adapter.showSidebarWithToolOutputs();
    } else if (adapter?.toggleSidebar) {
        adapter.toggleSidebar(); // Fallback
    } else {
        console.warn('[LangDock Adapter] No method found to show sidebar.');
    }
}

function hideLangDockSidebar(adapter: SimpleSiteAdapter | null): void {
    console.debug('[LangDock Adapter] MCP Disabled - Hiding sidebar');
     if (adapter?.hideSidebar) {
        adapter.hideSidebar();
     } else if (adapter?.sidebarManager?.hide) {
         adapter.sidebarManager.hide();
     } else if (adapter?.toggleSidebar) {
        adapter.toggleSidebar(); // Fallback (might show if already hidden)
    } else {
        console.warn('[LangDock Adapter] No method found to hide sidebar.');
    }
}

// LangDock-specific URL key generation
function getLangDockURLKey(): string {
    // Simple key for LangDock
    return 'langdock_chat';
}

// LangDock Adapter Configuration
const langdockAdapterConfig: AdapterConfig = {
  adapterName: 'LangDock',
  storageKeyPrefix: 'mcp-langdock-state', // Use chrome.storage, so prefix is enough
  findButtonInsertionPoint: findLangDockButtonInsertionPoint,
  getStorage: () => chrome.storage.local, // LangDock uses chrome.storage.local
  getCurrentURLKey: getLangDockURLKey, // Use LangDock-specific key generation
  onMCPEnabled: showLangDockSidebar,
  onMCPDisabled: hideLangDockSidebar,
  // Optional overrides if needed:
  // insertToggleButtons: customInsertFunction, 
  // updateUI: customUpdateUI,
};

// Initialize LangDock components using the common initializer
export function initLangDockComponents(): void {
  console.debug('Initializing LangDock MCP components using common framework');
  // The initializeAdapter function handles state loading, button insertion, listeners etc.
  const stateManager = initializeAdapter(langdockAdapterConfig);

  // Expose manual injection for debugging (optional, uses adapter name)
   window.injectMCPButtons = () => {
       console.debug('Manual injection for LangDock triggered');
       // Use the specific function exposed by initializeAdapter if needed, or re-call init
       const insertFn = (window as any)[`injectMCPButtons_${langdockAdapterConfig.adapterName}`];
       if (insertFn) {
           insertFn();
       } else {
           console.warn('Manual injection function not found.');
       }
   };

  console.debug('LangDock MCP components initialization complete.');
}
