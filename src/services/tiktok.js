import fetch from "node-fetch";

export async function getVideoInfo(inputUrl) {
  console.log(`[TikTok Service] Analyzing URL: ${inputUrl}`);

  try {
    // 1. Clean the URL (remove trackers like ?sender_device=pc)
    const cleanUrl = inputUrl.split("?")[0];

    // 2. Use a Public Resolver API (TikWM)
    // This service handles the complexity of TikTok's signatures and captchas.
    // It returns a direct link to the MP4 without a watermark.
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(
      cleanUrl
    )}`;

    console.log(`[TikTok Service] Requesting metadata from resolver...`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Resolver API Error: ${response.status}`);
    }

    const data = await response.json();

    // TikWM returns code: 0 for success
    if (data.code !== 0) {
      throw new Error(`TikTok API Error: ${data.msg || "Unknown error"}`);
    }

    const videoData = data.data;

    console.log(`[TikTok Service] Success! Found video: ${videoData.id}`);

    return {
      id: videoData.id,
      desc: videoData.title || "TikTok Video",
      // 'play' is the URL without watermark
      // 'wmplay' is the URL with watermark
      url: videoData.play,
      cover: videoData.cover,
      author: videoData.author.nickname,
    };
  } catch (error) {
    console.error("[TikTok Service] Error:", error.message);
    // Re-throw so the UI knows something went wrong
    throw error;
  }
}
