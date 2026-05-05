import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT_DIR = Path("scraped_data")
OUTPUT_DIR.mkdir(exist_ok=True)


async def scrape_facebook_group(group_url: str, max_posts: int = 20):
    listings = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )
        page = await context.new_page()

        print(f"Opening {group_url}...")
        await page.goto(group_url)

        await page.wait_for_timeout(5000)

        print("Scrolling to load posts...")
        for _ in range(8):
            await page.mouse.wheel(0, 2000)
            await page.wait_for_timeout(1500)

        posts = await page.query_selector_all('div[role="article"]')

        print(f"Found {len(posts)} posts, scraping first {max_posts}...")

        for i, post in enumerate(posts[:max_posts]):
            try:
                text_content = await post.text_content()
                text_content = text_content.strip()[:500] if text_content else ""

                images = await post.query_selector_all("img")
                post_images = []
                for img in images[:5]:
                    src = await img.get_attribute("src")
                    if src and src.startswith("http") and "amazon" not in src.lower():
                        post_images.append(src)

                if text_content or post_images:
                    listing = {
                        "id": i + 1,
                        "description": text_content,
                        "images": post_images,
                        "scraped_at": datetime.now().isoformat(),
                    }
                    listings.append(listing)
                    print(
                        f"Post {i + 1}: {len(post_images)} images, {len(text_content)} chars"
                    )

            except Exception as e:
                print(f"Error scraping post {i + 1}: {e}")
                continue

        await browser.close()

        output_file = (
            OUTPUT_DIR / f"listings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(listings, f, ensure_ascii=False, indent=2)

        print(f"\nSaved {len(listings)} listings to {output_file}")
        return listings


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scrape_facebook.py <facebook_group_url>")
        print(
            "Example: python scrape_facebook.py https://www.facebook.com/groups/123456789"
        )
        sys.exit(1)

    group_url = sys.argv[1]

    try:
        print(f"\n=== Scraping {group_url} ===")
        await scrape_facebook_group(group_url, max_posts=20)
    except Exception as e:
        print(f"Error scraping group: {e}")

    print("\n=== Done! Check scraped_data folder ===")


if __name__ == "__main__":
    asyncio.run(main())
