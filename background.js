importScripts('classifier.js');
let activeTab = null;
let startTime = null;

// Listen for tab switches
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await handleTabChange(activeInfo.tabId);
});

// Listen for tab updates (like navigating to a new URL)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    await handleTabChange(tabId);
  }
});

// Listen for window focus change
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // User left the browser entirely
    await saveTime();
    startTime = null;
    activeTab = null;
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) await handleTabChange(tab.id);
  }
});

async function handleTabChange(tabId) {
  // Save time for previous tab first
  await saveTime();

  // Start tracking new tab
  const tab = await chrome.tabs.get(tabId);
  activeTab = {
    id: tabId,
    url: tab.url,
    title: tab.title
  };
  startTime = Date.now();
}

async function saveTime() {
  if (!activeTab || !startTime) return;

  const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
  if (timeSpent < 3) return; // ignore accidental clicks

  const domain = getDomain(activeTab.url);
  if (!domain) return;

  const today = getToday();

  // Get existing data
  const result = await chrome.storage.local.get(today);
  const dayData = result[today] || {};

  // Add time to this domain
  dayData[domain] = (dayData[domain] || 0) + timeSpent;

  // Save back
  await chrome.storage.local.set({ [today]: dayData });
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function getToday() {
  return new Date().toISOString().split("T")[0]; // "2024-01-15"
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "YOUTUBE_CONTEXT") {
    saveYouTubeContext(message.context, sender.tab.url);
  }
});

async function saveYouTubeContext(context, url) {
  const today = getToday();
  const result = await chrome.storage.local.get(today);
  const dayData = result[today] || {};

  if (!dayData.youtubeActivity) dayData.youtubeActivity = [];

  // Avoid duplicates
  const alreadyExists = dayData.youtubeActivity.some(
    (item) => item.title === context.title && item.type === context.type
  );

  if (alreadyExists) return;

  // Classify with Gemini before saving
  console.log("Classifying:", context.title);
  const classified = await classifyYouTubeActivity(context);
  console.log("Classification result:", classified);

  dayData.youtubeActivity.push(classified);
  await chrome.storage.local.set({ [today]: dayData });
}

async function saveYouTubeTitle(title, url) {
  const today = getToday();
  const result = await chrome.storage.local.get(today);
  const dayData = result[today] || {};

  // Store youtube titles separately
  if (!dayData.youtubeTitles) dayData.youtubeTitles = [];
  
  // Avoid duplicates
  if (!dayData.youtubeTitles.includes(title)) {
    dayData.youtubeTitles.push(title);
  }

  await chrome.storage.local.set({ [today]: dayData });
}