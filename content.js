function getYouTubeContext() {
  const url = window.location.href;
  const rawTitle = document.title.replace(" - YouTube", "").trim();

  if (url.includes("/shorts/")) {
    return {
      type: "shorts",
      title: rawTitle || "YouTube Shorts"
    };
  }

  if (url.includes("/watch")) {
    return {
      type: "video",
      title: rawTitle || "Unknown Video"
    };
  }

  return {
    type: "surfing",
    title: getYouTubeSurfingContext(url)
  };
}

function getYouTubeSurfingContext(url) {
  if (url.includes("/results")) return "YouTube Search";
  if (url.includes("/feed/subscriptions")) return "YouTube Subscriptions";
  if (url.includes("/feed/trending")) return "YouTube Trending";
  if (url.includes("/@") || url.includes("/channel/")) return "YouTube Channel Page";
  return "YouTube Browsing";
}

function sendContextToBackground(context) {
  // Check if extension context is still valid before sending
  if (!chrome.runtime?.id) {
    clearInterval(intervalId);
    return;
  }

  try {
    chrome.runtime.sendMessage({
      type: "YOUTUBE_CONTEXT",
      context: context
    });
  } catch (e) {
    // Context invalidated — stop the interval silently
    clearInterval(intervalId);
  }
}

let lastTitle = "";

const intervalId = setInterval(() => {
  try {
    const context = getYouTubeContext();

    if (context.title && context.title !== lastTitle) {
      lastTitle = context.title;
      sendContextToBackground(context);
      console.log("LockedIn detected:", context);
    }
  } catch (e) {
    clearInterval(intervalId);
  }
}, 3000);