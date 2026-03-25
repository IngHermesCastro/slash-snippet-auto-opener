"use strict";
(() => {
  // src/background/service-worker.ts
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      console.log("[SlashSnippet] Extension installed successfully");
    } else if (details.reason === "update") {
      console.log("[SlashSnippet] Extension updated");
    }
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[SlashSnippet] Message received:", message);
    if (message.action === "getStatus") {
      sendResponse({ status: "Extension is active" });
    }
  });
  console.log("[SlashSnippet] Service worker loaded");
})();
