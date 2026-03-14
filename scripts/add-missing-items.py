#!/usr/bin/env python3
"""
Script to complete items.json and recipes.json with missing data:
- Animal products: Rabbit's Foot, Duck Feather, Wool, Dinosaur Egg, Ostrich Egg, Golden Egg
- Artisan goods: Cloth, Dinosaur Mayonnaise
- Fish: Void Salmon, Woodskip, Bullhead, Chub, Spook Fish, Blobfish, Midnight Squid,
        Lionfish, Blue Discus, Stingray, Oyster
- Forageable crops: Red Mushroom, Purple Mushroom, Chanterelle, Snow Yam, Magma Cap,
                    Spring Onion, Crocus, Daffodil, Holly, Sweet Pea,
                    Nautilus Shell, Coral, Sea Urchin
- Processing recipes for existing forageable items (Keg/Preserves/Dehydrator)
- Processing recipes for new forageable/mushroom items
- Wool -> Cloth (Loom), Dino Egg -> Dino Mayo, Ostrich Egg -> Mayo, Golden Egg -> Gold Mayo
- Fix "Goat Large Milk" typo -> "Large Goat Milk" in recipes.json
"""

import json
import math
import os
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ITEMS_JSON = BASE_DIR / "data" / "items.json"
RECIPES_JSON = BASE_DIR / "data" / "recipes.json"
ANIMALS_DIR = BASE_DIR / "public" / "sprites" / "bases" / "animals"
FISH_DIR = BASE_DIR / "public" / "sprites" / "bases" / "fish"
CROPS_DIR = BASE_DIR / "public" / "sprites" / "bases" / "crops"
PROCESSEDES_DIR = BASE_DIR / "public" / "sprites" / "processedes"

for d in [ANIMALS_DIR, FISH_DIR, CROPS_DIR, PROCESSEDES_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def q(n):
    """Quality price tiers for a given base price."""
    return {
        "normal": n,
        "silver": math.floor(n * 1.25),
        "gold": math.floor(n * 1.5),
        "iridium": n * 2,
    }


def rancher(base_prices):
    """Apply 1.2x rancher multiplier to all quality tiers."""
    return {k: math.floor(v * 1.2) for k, v in base_prices.items()}


def artisan(base_normal):
    """Apply artisan 1.4x multiplier and generate quality tiers."""
    artisan_normal = math.floor(base_normal * 1.4)
    return q(artisan_normal)


def slug(name):
    return name.lower().replace(" ", "-").replace("'", "").replace(".", "")


def get_wiki_image_url(filename):
    """Get the direct image URL for a wiki file using the MediaWiki API."""
    api_url = "https://stardewvalleywiki.com/mediawiki/api.php"
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }
    url = api_url + "?" + urllib.parse.urlencode(params)
    headers = {"User-Agent": "dewi-stardew-app/1.0"}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        pages = data["query"]["pages"]
        for page in pages.values():
            if "imageinfo" in page:
                return page["imageinfo"][0]["url"]
    except Exception as e:
        print(f"  [api-err] {filename}: {e}")
    return None


def download_sprite(name, wiki_filename, dest_path):
    """Download a sprite from the wiki. Returns True if successful."""
    if dest_path.exists():
        print(f"  [skip] {dest_path.name} already exists")
        return True
    url = get_wiki_image_url(wiki_filename)
    if not url:
        print(f"  [err] Could not get URL for {wiki_filename}")
        return False
    headers = {"User-Agent": "dewi-stardew-app/1.0"}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            with open(dest_path, "wb") as f:
                f.write(resp.read())
        print(f"  [ok] Downloaded {dest_path.name}")
        return True
    except Exception as e:
        print(f"  [err] Failed to download {url}: {e}")
        return False


# ===========================================================================
# ITEMS TO ADD
# ===========================================================================

# Animal products: (name, base_price, has_quality, has_rancher, days_to_mature, description)
NEW_ANIMAL_PRODUCTS = [
    ("Rabbit's Foot", 565, True, True, 4, "It's been separated from its owner, but it still holds its lucky power."),
    ("Duck Feather", 125, True, True, 2, "It's so colorful and beautiful."),
    ("Wool", 340, True, True, 3, "It's super soft."),
    ("Dinosaur Egg", 350, True, True, 7, "A giant spotted egg... The stegosaurus inside is long dead."),
    ("Ostrich Egg", 600, True, True, 7, "At 2.2 kilograms, it's a remarkably large egg."),
    ("Golden Egg", 500, True, True, 1, "This egg gleams with a pure golden light."),
]

# Artisan goods: (name, base_price, has_artisan, description, sprite_file)
NEW_ARTISAN_GOODS = [
    ("Cloth", 470, True, "A bolt of fine cloth.", "cloth.png"),
    ("Dinosaur Mayonnaise", 800, True, "It's an odd color... This must be from a Dino Egg.", "dinosaur-mayonnaise.png"),
]

# Fish: (name, base_price, description)
NEW_FISH = [
    ("Void Salmon", 150, "A salmon that's turned dark and gloomy. A little scary."),
    ("Woodskip", 75, "A rare fish that lives only in special forest pools."),
    ("Bullhead", 75, "This fish is attracted to metal objects."),
    ("Chub", 50, "A common freshwater fish."),
    ("Spook Fish", 220, "Its extremely large eyes are designed to pick up the faintest traces of light."),
    ("Blobfish", 500, "This bizarre creature spent its entire life at extreme ocean depths before you caught it."),
    ("Midnight Squid", 100, "It drifts along the bottom of the sea, preying on whatever unfortunate creature happens by."),
    ("Lionfish", 100, "Despite its fearsome look, the meat is surprisingly sweet. Don't touch the spines!"),
    ("Blue Discus", 120, "A rare freshwater fish imported from South America."),
    ("Stingray", 180, "Despite its fearsome reputation, it's quite docile and shy."),
    ("Oyster", 40, "Plucked from the ocean floor. Not to be confused with the Pearl."),
]

# Forageable crops: (name, base_price, description, is_mushroom)
# is_mushroom = True => Preserves + Dehydrator; False => Keg + Preserves (vegetables/flowers)
# has_processor = whether it can be processed at all
NEW_FORAGEABLE_CROPS = [
    # Mushrooms (Preserves + Dehydrator)
    ("Red Mushroom", 75, "A very rare mushroom with a powerful, concentrated flavor.", True, True),
    ("Purple Mushroom", 250, "A rare mushroom found deep in the mines.", True, True),
    ("Chanterelle", 160, "A tasty mushroom with a fruity smell and a mild, nutty flavor.", True, True),
    ("Magma Cap", 400, "A glowing mushroom that thrives in intense heat.", True, True),
    # Vegetables (Keg + Preserves)
    ("Spring Onion", 8, "It's a little smelly, but very nutritious.", False, True),
    ("Snow Yam", 100, "This little yam was hiding beneath the snow.", False, True),
    # Flowers/decorative (no processing)
    ("Crocus", 60, "A flower that blooms in the winter.", False, False),
    ("Daffodil", 30, "A traditional spring flower that makes a nice gift.", False, False),
    ("Holly", 80, "The leaves and bright red berries make a popular winter decoration.", False, False),
    ("Sweet Pea", 50, "A fragrant summer flower.", False, False),
    # Sea/ocean forageables (no processing)
    ("Nautilus Shell", 120, "A nautilus shell, found washed up on the beach. The inside is a perfect spiral.", False, False),
    ("Coral", 80, "A rare and beautiful coral from the ocean.", False, False),
    ("Sea Urchin", 160, "A spiny creature found on the ocean floor.", False, False),
]

# Wiki filenames for sprites (key = item name, value = wiki filename for API lookup)
SPRITE_WIKI_FILENAMES = {
    # Animal products -> animals dir
    "Rabbit's Foot": ("Rabbit's_Foot.png", ANIMALS_DIR),
    "Duck Feather": ("Duck_Feather.png", ANIMALS_DIR),
    "Wool": ("Wool.png", ANIMALS_DIR),
    "Dinosaur Egg": ("Dinosaur_Egg.png", ANIMALS_DIR),
    "Ostrich Egg": ("Ostrich_Egg.png", ANIMALS_DIR),
    "Golden Egg": ("Golden_Egg.png", ANIMALS_DIR),
    # Artisan goods -> processedes dir
    "Cloth": ("Cloth.png", PROCESSEDES_DIR),
    "Dinosaur Mayonnaise": ("Dinosaur_Mayonnaise.png", PROCESSEDES_DIR),
    # Fish -> fish dir
    "Void Salmon": ("Void_Salmon.png", FISH_DIR),
    "Woodskip": ("Woodskip.png", FISH_DIR),
    "Bullhead": ("Bullhead.png", FISH_DIR),
    "Chub": ("Chub.png", FISH_DIR),
    "Spook Fish": ("Spook_Fish.png", FISH_DIR),
    "Blobfish": ("Blobfish.png", FISH_DIR),
    "Midnight Squid": ("Midnight_Squid.png", FISH_DIR),
    "Lionfish": ("Lionfish.png", FISH_DIR),
    "Blue Discus": ("Blue_Discus.png", FISH_DIR),
    "Stingray": ("Stingray.png", FISH_DIR),
    "Oyster": ("Oyster.png", FISH_DIR),
    # Forageable crops -> crops dir
    "Red Mushroom": ("Red_Mushroom.png", CROPS_DIR),
    "Purple Mushroom": ("Purple_Mushroom.png", CROPS_DIR),
    "Chanterelle": ("Chanterelle.png", CROPS_DIR),
    "Magma Cap": ("Magma_Cap.png", CROPS_DIR),
    "Spring Onion": ("Spring_Onion.png", CROPS_DIR),
    "Snow Yam": ("Snow_Yam.png", CROPS_DIR),
    "Crocus": ("Crocus.png", CROPS_DIR),
    "Daffodil": ("Daffodil.png", CROPS_DIR),
    "Holly": ("Holly.png", CROPS_DIR),
    "Sweet Pea": ("Sweet_Pea.png", CROPS_DIR),
    "Nautilus Shell": ("Nautilus_Shell.png", CROPS_DIR),
    "Coral": ("Coral.png", CROPS_DIR),
    "Sea Urchin": ("Sea_Urchin.png", CROPS_DIR),
}


# ===========================================================================
# RECIPES TO ADD
# ===========================================================================

def make_crop_recipes(item_name):
    """Keg (juice) + Preserves Jar (pickles) for a vegetable crop."""
    return {
        "base": item_name,
        "products": [
            {
                "name": f"{item_name} Juice",
                "processor": "Keg",
                "priceFormula": "juice",
                "ingredients": [{"name": item_name, "quantity": 1}],
                "processingDays": 4,
            },
            {
                "name": f"Pickled {item_name}",
                "processor": "Preserves Jar",
                "priceFormula": "pickles",
                "ingredients": [{"name": item_name, "quantity": 1}],
                "processingDays": 2.5,
            },
        ],
    }


def make_mushroom_recipes(item_name):
    """Preserves Jar (pickles) + Dehydrator (dried) for mushrooms."""
    return {
        "base": item_name,
        "products": [
            {
                "name": f"Pickled {item_name}",
                "processor": "Preserves Jar",
                "priceFormula": "pickles",
                "ingredients": [{"name": item_name, "quantity": 1}],
                "processingDays": 2.5,
            },
            {
                "name": f"Dried {item_name}",
                "processor": "Dehydrator",
                "priceFormula": "dried",
                "ingredients": [{"name": item_name, "quantity": 5}],
                "processingDays": 1,
            },
        ],
    }


# Existing forageable crops missing Keg/Preserves recipes
EXISTING_CROP_RECIPES_TO_ADD = [
    "Wild Horseradish",
    "Cave Carrot",
    "Leek",
    "Dandelion",
    "Hazelnut",
    "Winter Root",
    "Ginger",
    "Fiddlehead Fern",
]

# Existing mushrooms missing Preserves/Dehydrator recipes
EXISTING_MUSHROOM_RECIPES_TO_ADD = [
    "Common Mushroom",
    "Morel",
]

# Special recipes for animal products
SPECIAL_ANIMAL_RECIPES = [
    {
        "base": "Wool",
        "products": [
            {
                "name": "Cloth",
                "processor": "Loom",
                "ingredients": [{"name": "Wool", "quantity": 1}],
                "processingDays": 0.167,
            }
        ],
    },
    {
        "base": "Dinosaur Egg",
        "products": [
            {
                "name": "Dinosaur Mayonnaise",
                "processor": "Mayonnaise Machine",
                "ingredients": [{"name": "Dinosaur Egg", "quantity": 1}],
                "processingDays": 0.125,
            }
        ],
    },
    {
        "base": "Ostrich Egg",
        "products": [
            {
                "name": "Mayonnaise",
                "processor": "Mayonnaise Machine",
                "outputQuantity": 10,
                "ingredients": [{"name": "Ostrich Egg", "quantity": 1}],
                "processingDays": 0.125,
            }
        ],
    },
    {
        "base": "Golden Egg",
        "products": [
            {
                "name": "Mayonnaise",
                "processor": "Mayonnaise Machine",
                "outputQuantity": 3,
                "outputQuality": "gold",
                "ingredients": [{"name": "Golden Egg", "quantity": 1}],
                "processingDays": 0.125,
            }
        ],
    },
]


def main():
    # Load data
    with open(ITEMS_JSON) as f:
        items_data = json.load(f)
    with open(RECIPES_JSON) as f:
        recipes_data = json.load(f)

    items = items_data["items"]
    recipes = recipes_data["recipes"]
    existing_item_names = {item["name"] for item in items}
    existing_recipe_bases = {
        recipe["base"] if isinstance(recipe["base"], str) else None
        for recipe in recipes
    }
    # For multi-processor recipes: check by base+processor combo
    existing_base_processor = set()
    for recipe in recipes:
        if isinstance(recipe["base"], str):
            for p in recipe["products"]:
                existing_base_processor.add((recipe["base"], p["processor"]))

    print("=" * 60)
    print("UPDATING ITEMS")
    print("=" * 60)

    # Add animal products
    for name, base_price, has_quality, has_rancher, days, desc in NEW_ANIMAL_PRODUCTS:
        if name in existing_item_names:
            print(f"[skip] {name} already exists")
            continue
        base_prices = q(base_price) if has_quality else {"normal": base_price}
        item = {
            "name": name,
            "category": "animal-product",
            "base": True,
            "prices": {"base": base_prices},
            "description": desc,
            "daysToMature": days,
        }
        if has_rancher:
            item["prices"]["rancher"] = rancher(base_prices)
        items.append(item)
        print(f"[add] {name} ({base_price}g)")

    # Add artisan goods
    for name, base_price, has_artisan, desc, sprite_file in NEW_ARTISAN_GOODS:
        if name in existing_item_names:
            print(f"[skip] {name} already exists")
            continue
        base_prices = {"normal": base_price}
        item = {
            "name": name,
            "category": "artisan-good",
            "base": False,
            "prices": {"base": base_prices},
            "description": desc,
            "spritePath": f"/sprites/processedes/{sprite_file}",
        }
        if has_artisan:
            artisan_normal = math.floor(base_price * 1.4)
            item["prices"]["artisan"] = {"normal": artisan_normal}
        items.append(item)
        print(f"[add] {name} ({base_price}g)")

    # Add fish
    for name, base_price, desc in NEW_FISH:
        if name in existing_item_names:
            print(f"[skip] {name} already exists")
            continue
        item_slug = slug(name)
        item = {
            "name": name,
            "category": "fish",
            "base": True,
            "prices": {"base": q(base_price)},
            "description": desc,
            "spritePath": f"/sprites/bases/fish/{item_slug}.png",
        }
        items.append(item)
        print(f"[add] {name} ({base_price}g)")

    # Add forageable crops
    for name, base_price, desc, is_mushroom, has_processor in NEW_FORAGEABLE_CROPS:
        if name in existing_item_names:
            print(f"[skip] {name} already exists")
            continue
        item = {
            "name": name,
            "category": "crop",
            "base": True,
            "forageable": True,
            "prices": {"base": q(base_price)},
            "description": desc,
        }
        items.append(item)
        print(f"[add] {name} ({base_price}g)")

    # Sort items alphabetically
    items.sort(key=lambda i: i["name"])
    items_data["items"] = items

    print("\n" + "=" * 60)
    print("UPDATING RECIPES")
    print("=" * 60)

    # Fix "Goat Large Milk" -> "Large Goat Milk" typo
    fixed_typo = False
    for recipe in recipes:
        for product in recipe["products"]:
            for ing in product.get("ingredients", []):
                if ing.get("name") == "Goat Large Milk":
                    ing["name"] = "Large Goat Milk"
                    fixed_typo = True
    if fixed_typo:
        print("[fix] Replaced 'Goat Large Milk' with 'Large Goat Milk'")

    def has_processor_recipe(base_name, processor):
        return (base_name, processor) in existing_base_processor

    def add_recipe_if_missing(recipe_obj):
        base = recipe_obj["base"]
        if not isinstance(base, str):
            return
        for product in recipe_obj["products"]:
            proc = product["processor"]
            if not has_processor_recipe(base, proc):
                # Find or create a recipe entry for this base
                # Check if there's already a recipe for this base
                existing = next((r for r in recipes if r["base"] == base), None)
                if existing:
                    existing["products"].append(product)
                    print(f"[add-product] {base} -> {product['name']} ({proc})")
                else:
                    recipes.append({"base": base, "products": [product]})
                    print(f"[add-recipe] {base} -> {product['name']} ({proc})")
                existing_base_processor.add((base, proc))

    # Add Keg+Preserves for existing forageable crops
    for crop_name in EXISTING_CROP_RECIPES_TO_ADD:
        recipe = make_crop_recipes(crop_name)
        add_recipe_if_missing(recipe)

    # Add Preserves+Dehydrator for existing mushrooms
    for mushroom_name in EXISTING_MUSHROOM_RECIPES_TO_ADD:
        recipe = make_mushroom_recipes(mushroom_name)
        add_recipe_if_missing(recipe)

    # Add recipes for new forageable crops
    for name, base_price, desc, is_mushroom, has_processor in NEW_FORAGEABLE_CROPS:
        if not has_processor:
            continue
        if is_mushroom:
            recipe = make_mushroom_recipes(name)
        else:
            recipe = make_crop_recipes(name)
        add_recipe_if_missing(recipe)

    # Add special animal product recipes
    for recipe in SPECIAL_ANIMAL_RECIPES:
        add_recipe_if_missing(recipe)

    print("\n" + "=" * 60)
    print("SAVING FILES")
    print("=" * 60)

    with open(ITEMS_JSON, "w") as f:
        json.dump(items_data, f, indent=2)
        f.write("\n")
    print(f"Saved items.json ({len(items)} items)")

    with open(RECIPES_JSON, "w") as f:
        json.dump(recipes_data, f, indent=2)
        f.write("\n")
    print(f"Saved recipes.json ({len(recipes)} recipes)")

    print("\n" + "=" * 60)
    print("DOWNLOADING SPRITES")
    print("=" * 60)

    for item_name, (wiki_filename, dest_dir) in SPRITE_WIKI_FILENAMES.items():
        item_slug = slug(item_name)
        dest_path = dest_dir / f"{item_slug}.png"
        print(f"\n{item_name}:")
        download_sprite(item_name, wiki_filename, dest_path)
        time.sleep(0.3)

    print("\nDone!")


if __name__ == "__main__":
    main()
