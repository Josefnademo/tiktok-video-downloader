import fetch from "node-fetch";

export async function getVideoInfo(inputUrl) {
  console.log(`[TikTok Service] Analyzing: ${inputUrl}`);

  // 1. Clean URL
  const cleanUrl = inputUrl.split("?")[0];

  // 2. Use TikWM API with Headers
  const response = await fetch(
    `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
  );

  const json = await response.json();

  if (json.code !== 0) {
    throw new Error(`API Error: ${json.msg || "Unknown error from TikWM"}`);
  }

  const data = json.data;

  // 3. Extract qualities
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
    qualities: qualities,
    url: data.play,
  };
}
