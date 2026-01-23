import fetch from "node-fetch";

export async function getVideoInfo(inputUrl) {
  console.log(`[TikTok Service] Analyzing: ${inputUrl}`);

  // 1. Clean URL
  const cleanUrl = inputUrl.split("?")[0];

  // 2. Use TikWM API
  const response = await fetch(
    `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`
  );
  const json = await response.json();

  if (json.code !== 0) {
    throw new Error(`API Error: ${json.msg}`);
  }

  const data = json.data;

  // 3. Extract multiple qualities
  // 'hdplay' is High Quality (sometimes unavailable), 'play' is Standard
  const qualities = [
    { label: "Standard (No Watermark)", url: data.play, id: "sd" },
  ];

  if (data.hdplay && data.hdplay !== data.play) {
    qualities.unshift({
      label: "HD (No Watermark)",
      url: data.hdplay,
      id: "hd",
    });
  }

  return {
    id: data.id,
    desc: data.title || "TikTok Video",
    cover: data.cover,
    author: data.author.nickname,
    qualities: qualities, // Send list to UI
  };
}
