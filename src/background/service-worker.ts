/**
 * Service Worker for the extension
 * Handles background operations and extension lifecycle
 * @module background/service-worker
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SlashSnippet] Extension installed successfully');
  } else if (details.reason === 'update') {
    console.log('[SlashSnippet] Extension updated');
  }
});

// Listen for runtime messages (if needed in future)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SlashSnippet] Message received:', message);
  
  if (message.action === 'getStatus') {
    sendResponse({ status: 'Extension is active' });
  }
});

console.log('[SlashSnippet] Service worker loaded');
