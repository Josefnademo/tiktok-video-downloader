
## Commands

- Command for api testing
```
curl -L -A "Mozilla/5.0" "api22-normal-c-useast1a.tiktokv.com" -o video.mp4
```
- Command for tunneling through cloudflare
```
cloudflared tunnel --url http://localhost:3000
```

- Command to test the endpoint with token [PowerShell]
```
$h = @{ "x-api-token"="my_strong_token"; "Content-Type"="application/json" }
Invoke-RestMethod -Uri "http://localhost:3000/api/download" -Method POST -Headers $h -Body '{"url":"https://example.com/video"}'
```

- Command set a new value into env token [Powerchell]
```
setx API_TOKEN "my_token"
```
##  Used information
- Used api: https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/?aweme_id=...

- Tiktok video for demo: https://www.tiktok.com/@arkhamsorigin/video/7462239608529521950?q=destroy%20arasaka&t=175760085…
- [github [Xlinka TikTok-Downloader C#]:](https://github.com/Xlinka/TikTok-Downloader?tab=readme-ov-file)
- Old api: https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/play/?video_id=...
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
