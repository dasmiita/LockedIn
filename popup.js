const productiveSites = [
  "github.com", "leetcode.com", "stackoverflow.com",
  "docs.", "developer.", "claude.ai", "chatgpt.com",
  "notion.so", "figma.com", "codepen.io", "replit.com",
  "geeksforgeeks.org", "hackerrank.com", "codeforces.com",
  "kaggle.com", "coursera.org", "udemy.com", "edx.org",
  "khanacademy.org", "brilliant.org", "w3schools.com",
  "mdn", "npmjs.com", "pypi.org", "medium.com",
  "dev.to", "hashnode.com", "freecodecamp.org"
];

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function renderBreakdown(videos, youtubeSeconds) {
  const eduVideos = videos.filter(v => v.category === "educational");
  const entVideos = videos.filter(v => v.category === "entertainment");
  const total = videos.length || 1;
  const eduPct = Math.round((eduVideos.length / total) * 100);
  const entPct = Math.round((entVideos.length / total) * 100);
  const ambPct = 100 - eduPct - entPct;

  const bar = document.getElementById("breakdown-bar");
  const labels = document.getElementById("breakdown-labels");

  if (videos.length === 0) {
    bar.innerHTML = `<div class="breakdown-segment" style="width:100%;background:#2a2a36"></div>`;
    labels.innerHTML = `<div class="breakdown-label"><span style="color:#444">No videos tracked yet</span></div>`;
    return;
  }

  bar.innerHTML = `
    ${eduPct > 0 ? `<div class="breakdown-segment" style="width:${eduPct}%;background:#4ade80"></div>` : ""}
    ${entPct > 0 ? `<div class="breakdown-segment" style="width:${entPct}%;background:#f87171"></div>` : ""}
    ${ambPct > 0 ? `<div class="breakdown-segment" style="width:${ambPct}%;background:#fbbf24"></div>` : ""}
  `;

  labels.innerHTML = `
    <div class="breakdown-label">
      <div class="breakdown-label-dot" style="background:#4ade80"></div>
      Educational ${eduPct}% (${formatTime(Math.round(youtubeSeconds * eduPct / 100))})
    </div>
    <div class="breakdown-label">
      <div class="breakdown-label-dot" style="background:#f87171"></div>
      Entertainment ${entPct}% (${formatTime(Math.round(youtubeSeconds * entPct / 100))})
    </div>
    ${ambPct > 0 ? `
    <div class="breakdown-label">
      <div class="breakdown-label-dot" style="background:#fbbf24"></div>
      Ambiguous ${ambPct}%
    </div>` : ""}
  `;
}

function renderScore(dayData, videos) {
  const scoreCard = document.getElementById("score-card");

  const totalTime = Object.entries(dayData)
    .filter(([k]) => k !== "youtubeActivity" && k !== "youtubeTitles")
    .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0);

  const productiveTime = Object.entries(dayData)
    .filter(([k]) => productiveSites.some(s => k.includes(s)))
    .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0);

  const youtubeSeconds = dayData["www.youtube.com"] || 0;
  const eduVideos = videos.filter(v => v.category === "educational").length;
  const totalVideos = videos.length || 1;

  const productivityRatio = totalTime > 0 ? productiveTime / totalTime : 0;
  const youtubeRatio = totalTime > 0 ? youtubeSeconds / totalTime : 0;
  const eduRatio = eduVideos / totalVideos;

  let score = Math.round(
    (productivityRatio * 50) +
    (eduRatio * 30) +
    ((1 - youtubeRatio) * 20)
  );
  score = Math.min(100, Math.max(0, score));

  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";

  let rank, rankColor;
  if (score >= 90) { rank = "S Rank 🏆"; rankColor = "#4ade80"; }
  else if (score >= 75) { rank = "A Rank ⭐"; rankColor = "#60a5fa"; }
  else if (score >= 60) { rank = "B Rank 👍"; rankColor = "#fbbf24"; }
  else if (score >= 40) { rank = "C Rank 😐"; rankColor = "#ff8c00"; }
  else { rank = "D Rank 😬"; rankColor = "#f87171"; }

  let insight = "";
  if (score >= 80) insight = "You're crushing it today. Stay locked in.";
  else if (score >= 60) insight = "Solid day so far. Keep the momentum going.";
  else if (score >= 40) insight = "Decent balance. Try to cut back on entertainment a bit.";
  else if (productiveTime === 0) insight = "No productive sites detected yet. Time to get locked in.";
  else insight = "Lots of entertainment today. Tomorrow's a new chance.";

  scoreCard.innerHTML = `
    <div class="score-top">
      <div class="score-value" style="color:${color}">${score}</div>
      <div class="score-rank" style="color:${rankColor}">${rank}</div>
    </div>
    <div class="score-label"><span class="live-dot"></span>Productivity Score</div>
    <div class="score-insight">${insight}</div>
  `;
}

async function loadData() {
  const today = getToday();

  document.getElementById("date").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  });

  const result = await chrome.storage.local.get(today);
  const dayData = result[today] || {};

  const youtubeActivity = dayData.youtubeActivity || [];
  const videos = youtubeActivity.filter(a => a.type !== "surfing");

  const eduCount = videos.filter(v => v.category === "educational").length;
  const entCount = videos.filter(v => v.category === "entertainment").length;

  document.getElementById("edu-count").textContent = eduCount;
  document.getElementById("ent-count").textContent = entCount;

  const youtubeSeconds = dayData["www.youtube.com"] || 0;
  renderBreakdown(videos, youtubeSeconds);
  renderScore(dayData, videos);

  // Video list
  const videoList = document.getElementById("video-list");
  if (videos.length === 0) {
    videoList.innerHTML = '<div class="empty">No videos tracked yet today</div>';
  } else {
    const flags = {
      educational: "✅",
      entertainment: "🔴",
      ambiguous: "🟡",
      unknown: "⬜"
    };
    videoList.innerHTML = videos.reverse().map(v => `
      <div class="video-item ${v.category || 'unknown'}">
        <div class="video-flag">${flags[v.category] || "⬜"}</div>
        <div class="video-info">
          <div class="video-title">${v.title}</div>
          <span class="video-tag ${v.category || 'unknown'}">${(v.category || "unknown").toUpperCase()}</span>
          <div class="video-reason">${v.reason || ""}</div>
        </div>
      </div>
    `).join("");
  }

  // Domain list
  const excluded = ["www.youtube.com", "newtab", "extensions", "history"];
  const domains = Object.entries(dayData)
    .filter(([key]) => !excluded.includes(key) && key !== "youtubeActivity" && key !== "youtubeTitles")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxTime = domains[0]?.[1] || 1;
  const domainList = document.getElementById("domain-list");

  if (domains.length === 0) {
    domainList.innerHTML = '<div class="empty">No data yet</div>';
  } else {
    domainList.innerHTML = domains.map(([domain, seconds]) => {
      const isProductive = productiveSites.some(s => domain.includes(s));
      return `
        <div class="domain-item">
          <div class="domain-left">
            <div class="domain-name ${isProductive ? 'productive' : ''}">${isProductive ? '▶ ' : ''}${domain}</div>
            <div class="bar-bg">
              <div class="bar-fill ${isProductive ? 'productive' : ''}" style="width:${(seconds / maxTime) * 100}%"></div>
            </div>
          </div>
          <div class="domain-time">${formatTime(seconds)}</div>
        </div>
      `;
    }).join("");
  }
}

loadData(); 
document.getElementById("open-full-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
