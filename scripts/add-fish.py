#!/usr/bin/env python3
"""
Script to:
1. Add missing fishing-pole fish to items.json with quality prices
2. Add Coal to items.json (ingredient for Fish Smoker)
3. Download fish sprites to public/sprites/bases/fish/
4. Download Smoked Fish sprite to public/sprites/food/smoked-fish.png
5. Add spritePath to all fish items in items.json
"""

import json
import math
import os
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ITEMS_JSON = BASE_DIR / "data" / "items.json"
FISH_SPRITE_DIR = BASE_DIR / "public" / "sprites" / "bases" / "fish"
FOOD_SPRITE_DIR = BASE_DIR / "public" / "sprites" / "food"

FISH_SPRITE_DIR.mkdir(parents=True, exist_ok=True)

# Quality multipliers
def q(n): return {
    "normal": n,
    "silver": math.floor(n * 1.25),
    "gold": math.floor(n * 1.5),
    "iridium": n * 2,
}

# New fishing-pole fish to add (name, base_price)
NEW_FISH = [
    ("Anchovy", 30),
    ("Catfish", 200),
    ("Ghostfish", 45),
    ("Herring", 30),
    ("Ice Pip", 500),
    ("Lava Eel", 700),
    ("Octopus", 150),
    ("Perch", 55),
    ("Pike", 100),
    ("Pufferfish", 200),
    ("Red Mullet", 75),
    ("Red Snapper", 50),
    ("Sandfish", 75),
    ("Scorpion Carp", 150),
    ("Smallmouth Bass", 50),
    ("Stonefish", 300),
    ("Sturgeon", 200),
    ("Super Cucumber", 250),
    ("Tiger Trout", 150),
    ("Walleye", 105),
]

# Sprite URLs from the wiki
FISH_SPRITE_URLS = {
    "Pufferfish": "https://stardewvalleywiki.com/mediawiki/images/b/ba/Pufferfish.png",
    "Anchovy": "https://stardewvalleywiki.com/mediawiki/images/7/79/Anchovy.png",
    "Tuna": "https://stardewvalleywiki.com/mediawiki/images/c/c5/Tuna.png",
    "Sardine": "https://stardewvalleywiki.com/mediawiki/images/0/04/Sardine.png",
    "Bream": "https://stardewvalleywiki.com/mediawiki/images/8/82/Bream.png",
    "Largemouth Bass": "https://stardewvalleywiki.com/mediawiki/images/1/11/Largemouth_Bass.png",
    "Smallmouth Bass": "https://stardewvalleywiki.com/mediawiki/images/a/a5/Smallmouth_Bass.png",
    "Rainbow Trout": "https://stardewvalleywiki.com/mediawiki/images/1/14/Rainbow_Trout.png",
    "Salmon": "https://stardewvalleywiki.com/mediawiki/images/e/e0/Salmon.png",
    "Walleye": "https://stardewvalleywiki.com/mediawiki/images/0/05/Walleye.png",
    "Perch": "https://stardewvalleywiki.com/mediawiki/images/4/43/Perch.png",
    "Carp": "https://stardewvalleywiki.com/mediawiki/images/a/a8/Carp.png",
    "Catfish": "https://stardewvalleywiki.com/mediawiki/images/9/99/Catfish.png",
    "Pike": "https://stardewvalleywiki.com/mediawiki/images/3/31/Pike.png",
    "Sunfish": "https://stardewvalleywiki.com/mediawiki/images/5/56/Sunfish.png",
    "Red Mullet": "https://stardewvalleywiki.com/mediawiki/images/f/f2/Red_Mullet.png",
    "Herring": "https://stardewvalleywiki.com/mediawiki/images/f/f1/Herring.png",
    "Eel": "https://stardewvalleywiki.com/mediawiki/images/9/91/Eel.png",
    "Octopus": "https://stardewvalleywiki.com/mediawiki/images/5/5a/Octopus.png",
    "Red Snapper": "https://stardewvalleywiki.com/mediawiki/images/d/d3/Red_Snapper.png",
    "Squid": "https://stardewvalleywiki.com/mediawiki/images/8/81/Squid.png",
    "Sea Cucumber": "https://stardewvalleywiki.com/mediawiki/images/a/a9/Sea_Cucumber.png",
    "Super Cucumber": "https://stardewvalleywiki.com/mediawiki/images/d/d5/Super_Cucumber.png",
    "Ghostfish": "https://stardewvalleywiki.com/mediawiki/images/7/72/Ghostfish.png",
    "Stonefish": "https://stardewvalleywiki.com/mediawiki/images/0/03/Stonefish.png",
    "Ice Pip": "https://stardewvalleywiki.com/mediawiki/images/6/63/Ice_Pip.png",
    "Lava Eel": "https://stardewvalleywiki.com/mediawiki/images/1/12/Lava_Eel.png",
    "Sandfish": "https://stardewvalleywiki.com/mediawiki/images/b/bb/Sandfish.png",
    "Scorpion Carp": "https://stardewvalleywiki.com/mediawiki/images/7/76/Scorpion_Carp.png",
    "Flounder": "https://stardewvalleywiki.com/mediawiki/images/8/85/Flounder.png",
    "Midnight Carp": "https://stardewvalleywiki.com/mediawiki/images/3/33/Midnight_Carp.png",
    "Sturgeon": "https://stardewvalleywiki.com/mediawiki/images/4/42/Sturgeon.png",
    "Tiger Trout": "https://stardewvalleywiki.com/mediawiki/images/0/01/Tiger_Trout.png",
}

# Crab pot fish sprite URLs (to be looked up)
CRAB_POT_SPRITE_URLS = {
    "Shrimp": "https://stardewvalleywiki.com/mediawiki/images/4/4e/Shrimp.png",
    "Crayfish": "https://stardewvalleywiki.com/mediawiki/images/7/71/Crayfish.png",
    "Periwinkle": "https://stardewvalleywiki.com/mediawiki/images/0/0f/Periwinkle.png",
    "Snail": "https://stardewvalleywiki.com/mediawiki/images/3/3a/Snail.png",
    "Clam": "https://stardewvalleywiki.com/mediawiki/images/d/d4/Clam.png",
    "Mussel": "https://stardewvalleywiki.com/mediawiki/images/d/d1/Mussel.png",
    "Crab": "https://stardewvalleywiki.com/mediawiki/images/b/b9/Crab.png",
    "Lobster": "https://stardewvalleywiki.com/mediawiki/images/0/0d/Lobster.png",
    "Squid Ink": "https://stardewvalleywiki.com/mediawiki/images/9/90/Squid_Ink.png",
    "Seaweed": "https://stardewvalleywiki.com/mediawiki/images/5/55/Seaweed.png",
    "Green Algae": "https://stardewvalleywiki.com/mediawiki/images/2/27/Green_Algae.png",
    "White Algae": "https://stardewvalleywiki.com/mediawiki/images/9/90/White_Algae.png",
}

ALL_FISH_SPRITE_URLS = {**FISH_SPRITE_URLS, **CRAB_POT_SPRITE_URLS}

# Smoked Fish sprite
SMOKED_FISH_URL = "https://stardewvalleywiki.com/mediawiki/images/4/4c/Smoked_Fish.png"

# Coal sprite
COAL_URL = "https://stardewvalleywiki.com/mediawiki/images/5/5d/Coal.png"


def name_to_slug(name):
    return name.lower().replace(" ", "-").replace("'", "").replace(".", "")


def download_sprite(url, dest_path):
    """Download a sprite from the wiki. Returns True if successful."""
    if dest_path.exists():
        print(f"  [skip] {dest_path.name} already exists")
        return True
    headers = {"User-Agent": "dewi-stardew-app/1.0 (https://github.com/user/dewi)"}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            with open(dest_path, "wb") as f:
                f.write(resp.read())
        print(f"  [ok] Downloaded {dest_path.name}")
        return True
    except Exception as e:
        print(f"  [err] Failed to download {url}: {e}")
        return False


def main():
    # Load items.json
    with open(ITEMS_JSON) as f:
        data = json.load(f)

    items = data["items"]
    existing_names = {item["name"] for item in items}

    # 1. Add new fishing-pole fish
    for name, base_price in NEW_FISH:
        if name in existing_names:
            print(f"[skip] {name} already exists")
            continue
        slug = name_to_slug(name)
        item = {
            "name": name,
            "category": "fish",
            "base": True,
            "prices": {"base": q(base_price)},
            "spritePath": f"/sprites/bases/fish/{slug}.png",
        }
        items.append(item)
        print(f"[add] {name} ({base_price}g)")

    # 2. Add spritePath to existing fish items that don't have one
    for item in items:
        if item["category"] == "fish" and item.get("base") and "spritePath" not in item:
            slug = name_to_slug(item["name"])
            item["spritePath"] = f"/sprites/bases/fish/{slug}.png"
            print(f"[update spritePath] {item['name']}")

    # 3. Add Coal (for Fish Smoker ingredient cost)
    if "Coal" not in existing_names:
        items.append({
            "name": "Coal",
            "category": "processed",
            "base": True,
            "prices": {"base": {"normal": 15}},
            "spritePath": "/sprites/bases/other/coal.png",
        })
        print("[add] Coal (15g)")

    # 4. Sort items alphabetically
    items.sort(key=lambda i: i["name"])
    data["items"] = items

    # Save items.json
    with open(ITEMS_JSON, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print(f"\nSaved {len(items)} items to items.json")

    # 5. Download fish sprites
    print("\nDownloading fish sprites...")
    for fish_name, url in ALL_FISH_SPRITE_URLS.items():
        slug = name_to_slug(fish_name)
        dest = FISH_SPRITE_DIR / f"{slug}.png"
        download_sprite(url, dest)
        time.sleep(0.2)

    # 6. Download Coal sprite
    coal_dir = BASE_DIR / "public" / "sprites" / "bases" / "other"
    coal_dir.mkdir(parents=True, exist_ok=True)
    coal_dest = coal_dir / "coal.png"
    print("\nDownloading Coal sprite...")
    download_sprite(COAL_URL, coal_dest)

    # 7. Download Smoked Fish sprite
    print("\nDownloading Smoked Fish sprite...")
    smoked_dest = FOOD_SPRITE_DIR / "smoked-fish.png"
    download_sprite(SMOKED_FISH_URL, smoked_dest)

    print("\nDone!")


if __name__ == "__main__":
    main()
