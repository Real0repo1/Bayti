import asyncio
import json
import os
import httpx
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path("scraped_images")
OUTPUT_DIR.mkdir(exist_ok=True)

PROPERTY_KEYWORDS = [
    "modern apartment interior",
    "living room furnished",
    "bedroom design",
    "kitchen modern",
    "balcony apartment",
    "luxury villa interior",
    "studio apartment",
    "family house",
    "penthouse",
    "beach house",
]

IMAGES_BASE_URLS = [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    "https://images.unsplash.com/photo-1600573472550-80909b57b793?w=800",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdb3?w=800",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045aab1?w=800",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    "https://images.unsplash.com/photo-1600210492493-094691112478?w=800",
    "https://images.unsplash.com/photo-1616594039964-410363daaF6d7?w=800",
    "https://images.unsplash.com/photo-1615529182904-14819c419a91?w=800",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800",
    "https://images.unsplash.com/photo-1560185127-6ed189bf025f?w=800",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
    "https://images.unsplash.com/photo-1560448075-bb485b062938?w=800",
    "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800",
    "https://images.unsplash.com/photo-1605276374104-dee2d9238b70?w=800",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
]


async def download_image(client: httpx.AsyncClient, url: str, filepath: Path) -> bool:
    try:
        response = await client.get(url, follow_redirects=True, timeout=30.0)
        if response.status_code == 200:
            filepath.write_bytes(response.content)
            return True
    except Exception as e:
        print(f"Error downloading: {e}")
    return False


async def main():
    print("Downloading property images...")

    async with httpx.AsyncClient() as client:
        all_images = []

        print(f"\n=== Downloading {len(IMAGES_BASE_URLS)} images ===")

        for i, url in enumerate(IMAGES_BASE_URLS):
            filename = f"property_{i + 1}.jpg"
            filepath = OUTPUT_DIR / filename

            print(f"[{i + 1}/{len(IMAGES_BASE_URLS)}] Downloading...")
            if await download_image(client, url, filepath):
                print(f"  Saved: {filename}")
                all_images.append(
                    {
                        "filename": filename,
                        "keyword": PROPERTY_KEYWORDS[i % len(PROPERTY_KEYWORDS)],
                        "source": "unsplash",
                    }
                )

        metadata = {
            "scraped_at": datetime.now().isoformat(),
            "total_images": len(all_images),
            "images": all_images,
        }

        with open(OUTPUT_DIR / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        print(f"\n=== Done! Downloaded {len(all_images)} images to {OUTPUT_DIR} ===")


if __name__ == "__main__":
    asyncio.run(main())
