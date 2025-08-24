import fetch from "node-fetch";
import m3u8Parser from "m3u8-parser";

export async function parseHls(manifestUrl) {
  const res = await fetch(manifestUrl);
  if (!res.ok) throw new Error(`HLS HTTP ${res.status}`);
  const text = await res.text();
  const parser = new m3u8Parser.Parser();
  parser.push(text);
  parser.end();
  const { playlists = [] } = parser.manifest;
  return playlists.map((p) => ({
    resolution: p.attributes?.RESOLUTION
      ? `${p.attributes.RESOLUTION.width}x${p.attributes.RESOLUTION.height}`
      : "unknown",
    bandwidth: p.attributes?.BANDWIDTH,
    url: new URL(p.uri, manifestUrl).toString(),
  }));
}
