import asyncio
import httpx
from pathlib import Path

OUTPUT_DIR = Path("scraped_images/icons")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ICONS = [
    ("beach", "https://cdn-icons-png.flaticon.com/512/214/214335.png"),
    ("monument", "https://cdn-icons-png.flaticon.com/512/2079/2079199.png"),
    ("city", "https://cdn-icons-png.flaticon.com/512/2995/2995467.png"),
    ("metro", "https://cdn-icons-png.flaticon.com/512/2978/2978647.png"),
    ("airplane", "https://cdn-icons-png.flaticon.com/512/1099/1099585.png"),
    ("couch", "https://cdn-icons-png.flaticon.com/512/159/159498.png"),
    ("pet", "https://cdn-icons-png.flaticon.com/512/1076/1076928.png"),
    ("bed", "https://cdn-icons-png.flaticon.com/512/2907/2907546.png"),
    ("shower", "https://cdn-icons-png.flaticon.com/512/2966/2966324.png"),
    ("area", "https://cdn-icons-png.flaticon.com/512/814/814459.png"),
]


async def download_icon(client: httpx.AsyncClient, url: str, filepath: Path) -> bool:
    try:
        response = await client.get(url, follow_redirects=True, timeout=30.0)
        if response.status_code == 200:
            filepath.write_bytes(response.content)
            return True
    except Exception as e:
        print(f"Error: {e}")
    return False


async def main():
    async with httpx.AsyncClient() as client:
        for name, url in ICONS:
            filepath = OUTPUT_DIR / f"{name}.png"
            print(f"Downloading {name}...")
            await download_icon(client, url, filepath)
            print(f"  Saved: {name}.png")


asyncio.run(main())
