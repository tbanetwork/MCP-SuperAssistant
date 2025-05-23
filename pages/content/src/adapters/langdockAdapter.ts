/**
 * Langdock Adapter
 *
 * This file implements the site adapter for app.langdock.com
 */

import { BaseAdapter } from './common';
import { logMessage } from '../utils/helpers';
import {
  insertToolResultToChatInput,
  attachFileToChatInput,
  submitChatInput,
} from '../components/websites/langdock/chatInputHandler';
import { SidebarManager } from '../components/sidebar';
import { initDeepSeekComponents } from './adaptercomponents';

export class LangDockAdapter extends BaseAdapter {
  name = 'Langdock';
  hostname = ['app.langdock.com']; // Support langdock.com
  // URL patterns to only activate on specific paths
  urlPatterns = [
    /https?:\/\/(?:www\.)?(?:app\.langdock\.com\/chat)/, // app.langdock.com/chat URL
  ];

  // Properties to track navigation
  private lastUrl: string = '';
  private urlCheckInterval: number | null = null;

  constructor() {
    super();
    // Create the sidebar manager instance
    this.sidebarManager = SidebarManager.getInstance('langdock');
    logMessage('Created Langdock sidebar manager instance');
  }

  protected initializeSidebarManager(): void {
    this.sidebarManager.initialize();
  }

  protected initializeObserver(forceReset: boolean = false): void {
    // Check the current URL immediately
    this.checkCurrentUrl();

    initDeepSeekComponents();
    
    // Start URL checking to handle navigation within Langdock
    if (!this.urlCheckInterval) {
      this.lastUrl = window.location.href;
      this.urlCheckInterval = window.setInterval(() => {
        const currentUrl = window.location.href;
        
        if (currentUrl !== this.lastUrl) {
          logMessage(`URL changed from ${this.lastUrl} to ${currentUrl}`);
          this.lastUrl = currentUrl;

          initDeepSeekComponents();
          
          // Check if we should show or hide the sidebar based on URL
          this.checkCurrentUrl();
        }
      }, 1000); // Check every second
    }
  }

  /**
   * Clean up resources when the adapter is no longer needed
   */
  cleanup(): void {
    logMessage('Cleaning up Langdock adapter');

    // Clear interval for URL checking
    if (this.urlCheckInterval) {
      window.clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    // Call the parent cleanup method
    super.cleanup();
  }

  /**
   * Insert text into the Langdock input field
   * @param text Text to insert
   */
  insertTextIntoInput(text: string): void {
    insertToolResultToChatInput(text);
    logMessage(`Inserted text into Langdock input: ${text.substring(0, 20)}...`);
  }

  /**
   * Trigger submission of the Langdock input form
   */
  triggerSubmission(): void {
    submitChatInput();
    logMessage('Triggered Langdock form submission');
  }

  /**
   * Check if Langdock supports file upload
   * @returns true if file upload is supported
   */
  supportsFileUpload(): boolean {
    return true;
  }

  /**
   * Attach a file to the Langdock input
   * @param file The file to attach
   * @returns Promise that resolves to true if successful
   */
  async attachFile(file: File): Promise<boolean> {
    try {
      const result = await attachFileToChatInput(file);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(`Error in adapter when attaching file to Langdock input: ${errorMessage}`);
      console.error('Error in adapter when attaching file to Langdock input:', error);
      return false;
    }
  }

  /**
   * Force a full document scan for tool commands
   * This is useful when we suspect tool commands might have been missed
   */
  public forceFullScan(): void {
    logMessage('Forcing full document scan for Langdock');
  }

  /**
   * Check the current URL and show/hide sidebar accordingly
   */
  private checkCurrentUrl(): void {
    const currentUrl = window.location.href;
    logMessage(`Checking current Langdock URL: ${currentUrl}`);
    
    // For Langdock, we want to show the sidebar only on URLs that match our patterns
    const isValidUrl = this.urlPatterns.some(pattern => pattern.test(currentUrl));
    
    if (isValidUrl) {
      // Show sidebar for valid URLs
      if (this.sidebarManager && !this.sidebarManager.getIsVisible()) {
        logMessage('Showing sidebar for Langdock URL');
        this.sidebarManager.showWithToolOutputs();
      }
    } else {
      // Hide sidebar for invalid URLs
      if (this.sidebarManager && this.sidebarManager.getIsVisible()) {
        logMessage('Hiding sidebar for non-Langdock URL');
        this.sidebarManager.hide();
      }
    }
  }
}
