import fetch from "node-fetch";

// We rotate User-Agents just like your C# code did to avoid detection
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0",
];

export async function getVideoInfo(inputUrl) {
  console.log(`[TikTok Service] Analyzing URL: ${inputUrl}`);

  try {
    // 1. Extract Video ID (Regex from your C# code)
    // Matches: /video/7462239608529521950
    const videoIdMatch = inputUrl.match(/\/video\/(\d+)/);
    if (!videoIdMatch) {
      throw new Error(
        "Could not extract Video ID. Please ensure the link is a full TikTok URL."
      );
    }
    const videoId = videoIdMatch[1];
    console.log(`[TikTok Service] Extracted ID: ${videoId}`);

    // 2. Construct the Mobile API URL
    // This uses the exact same endpoint and parameters as your C# Program.cs
    const apiUrl = `https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/?aweme_id=${videoId}&iid=7318518857994389254&device_id=7318517321748022790&channel=googleplay&app_name=musical_ly&version_code=300904&device_platform=android&device_type=ASUS_Z01QD&version=9`;

    // 3. Select a random User-Agent
    const randomAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // 4. Fetch from API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": randomAgent,
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 5. Extract the Download URL (Logic from your C# ExtractDownloadUrl)
    // Path: aweme_list[0] -> video -> play_addr -> url_list[0]
    const videoItem = data.aweme_list && data.aweme_list[0];

    if (!videoItem) {
      throw new Error("Video not found in API response (aweme_list is empty).");
    }

    const downloadUrl = videoItem.video.play_addr.url_list[0];

    return {
      id: videoItem.aweme_id,
      desc: videoItem.desc || "TikTok Video",
      // C# code replaced \u0026 with &, but Node.js fetch handles this automatically usually.
      // We return the direct URL.
      url: downloadUrl,
      cover: videoItem.video.cover.url_list[0],
      author: videoItem.author.nickname,
    };
  } catch (error) {
    console.error("[TikTok Service] Error:", error.message);
    throw error;
  }
}
