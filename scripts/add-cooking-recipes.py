#!/usr/bin/env python3
"""
Add all cooking recipes from Stardew Valley wiki to items.json and recipes.json.
Also downloads cooked dish sprites.
"""

import json
import os
import urllib.request
import urllib.parse
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ITEMS_PATH = os.path.join(PROJECT_DIR, "data", "items.json")
RECIPES_PATH = os.path.join(PROJECT_DIR, "data", "recipes.json")
SPRITES_DIR = os.path.join(PROJECT_DIR, "public", "sprites", "food")

WIKI_BASE = "https://stardewvalleywiki.com"

# Quality multipliers
def qualities(normal):
    return {
        "normal": normal,
        "silver": int(normal * 1.25),
        "gold": int(normal * 1.5),
        "iridium": normal * 2,
    }

# ── New base items (ingredients not yet in items.json) ──────────────────

NEW_BASE_ITEMS = [
    # Fish
    {"name": "Sunfish", "category": "fish", "base": True, "prices": {"base": qualities(30)}, "description": "A common river fish."},
    {"name": "Bream", "category": "fish", "base": True, "prices": {"base": qualities(45)}, "description": "A fairly common river fish."},
    {"name": "Squid", "category": "fish", "base": True, "prices": {"base": qualities(80)}, "description": "A deep-sea creature."},
    {"name": "Sea Cucumber", "category": "fish", "base": True, "prices": {"base": qualities(75)}, "description": "A slimy, tube-shaped creature."},
    {"name": "Carp", "category": "fish", "base": True, "prices": {"base": qualities(30)}, "description": "A common pond fish."},
    {"name": "Salmon", "category": "fish", "base": True, "prices": {"base": qualities(75)}, "description": "Swims upstream to spawn."},
    {"name": "Tuna", "category": "fish", "base": True, "prices": {"base": qualities(100)}, "description": "A large fish that lives in the ocean."},
    {"name": "Largemouth Bass", "category": "fish", "base": True, "prices": {"base": qualities(100)}, "description": "A popular freshwater game fish."},
    {"name": "Rainbow Trout", "category": "fish", "base": True, "prices": {"base": qualities(65)}, "description": "A freshwater trout with colorful markings."},
    {"name": "Sardine", "category": "fish", "base": True, "prices": {"base": qualities(40)}, "description": "A common ocean fish."},
    {"name": "Eel", "category": "fish", "base": True, "prices": {"base": qualities(85)}, "description": "A long, slippery fish."},
    {"name": "Flounder", "category": "fish", "base": True, "prices": {"base": qualities(100)}, "description": "A flat fish that lives on the ocean floor."},
    {"name": "Midnight Carp", "category": "fish", "base": True, "prices": {"base": qualities(150)}, "description": "This shy fish only comes out at night."},

    # Crab pot items
    {"name": "Shrimp", "category": "fish", "base": True, "prices": {"base": qualities(60)}, "description": "A scavenger found in saltwater."},
    {"name": "Crayfish", "category": "fish", "base": True, "prices": {"base": qualities(75)}, "description": "A small freshwater relative of the lobster."},
    {"name": "Periwinkle", "category": "fish", "base": True, "prices": {"base": qualities(20)}, "description": "A tiny freshwater snail."},
    {"name": "Snail", "category": "fish", "base": True, "prices": {"base": qualities(65)}, "description": "A slow-moving crawling creature."},
    {"name": "Clam", "category": "fish", "base": True, "prices": {"base": qualities(50)}, "description": "Someone lived in here once."},
    {"name": "Mussel", "category": "fish", "base": True, "prices": {"base": qualities(30)}, "description": "A common bivalve."},
    {"name": "Crab", "category": "fish", "base": True, "prices": {"base": qualities(100)}, "description": "A marine crustacean with a hard shell."},
    {"name": "Lobster", "category": "fish", "base": True, "prices": {"base": qualities(120)}, "description": "A large ocean-dwelling crustacean."},

    # Foraged items
    {"name": "Leek", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(60)}, "description": "A tasty relative of the onion."},
    {"name": "Dandelion", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(40)}, "description": "Not the prettiest flower, but the leaves make a good salad."},
    {"name": "Common Mushroom", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(40)}, "description": "Slightly nutty, with good texture."},
    {"name": "Morel", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(150)}, "description": "Sought after for its unique nutty flavor."},
    {"name": "Cave Carrot", "category": "crop", "base": True, "prices": {"base": qualities(25)}, "description": "A starchy snack found in the mines."},
    {"name": "Hazelnut", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(90)}, "description": "That's one big hazelnut!"},
    {"name": "Fiddlehead Fern", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(90)}, "description": "The young shoots are an edible delicacy."},
    {"name": "Wild Horseradish", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(50)}, "description": "A spicy root found in the spring."},
    {"name": "Winter Root", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(70)}, "description": "A starchy tuber found by digging."},
    {"name": "Ginger", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(60)}, "description": "This sharp, spicy root can be used in cooking."},
    {"name": "Moss", "category": "crop", "base": True, "forageable": True, "prices": {"base": qualities(5)}, "description": "Hangs from the branches of old-growth trees."},
    {"name": "Seaweed", "category": "fish", "base": True, "prices": {"base": {"normal": 20}}, "description": "Can be used in cooking."},

    # Algae
    {"name": "Green Algae", "category": "fish", "base": True, "prices": {"base": {"normal": 15}}, "description": "It's slimy."},
    {"name": "White Algae", "category": "fish", "base": True, "prices": {"base": {"normal": 25}}, "description": "It's super slimy."},

    # Tree/artisan products
    {"name": "Maple Syrup", "category": "artisan-good", "base": True, "prices": {"base": {"normal": 200}}, "description": "A sweet syrup with a unique flavor."},
    {"name": "Void Mayonnaise", "category": "artisan-good", "base": True, "prices": {"base": {"normal": 275}}, "description": "A thick, purple paste that smells like burnt hair."},
    {"name": "Squid Ink", "category": "fish", "base": True, "prices": {"base": {"normal": 110}}, "description": "Used in cooking and dyeing."},
]

# ── Cooked dish items ───────────────────────────────────────────────────

# All 81 cooking recipes from the wiki. We add each as a "cooked" item.
# Some are also used as ingredients in other recipes.
COOKED_ITEMS = [
    {"name": "Fried Egg", "price": 35},
    {"name": "Omelet", "price": 125},
    {"name": "Salad", "price": 110},
    {"name": "Cheese Cauliflower", "price": 300},
    {"name": "Baked Fish", "price": 100},
    {"name": "Parsnip Soup", "price": 120},
    {"name": "Vegetable Medley", "price": 120},
    {"name": "Complete Breakfast", "price": 350},
    {"name": "Fried Calamari", "price": 150},
    {"name": "Strange Bun", "price": 225},
    {"name": "Lucky Lunch", "price": 250},
    {"name": "Fried Mushroom", "price": 200},
    {"name": "Pizza", "price": 300},
    {"name": "Bean Hotpot", "price": 100},
    {"name": "Glazed Yams", "price": 200},
    {"name": "Carp Surprise", "price": 150},
    {"name": "Hashbrowns", "price": 120},
    {"name": "Pancakes", "price": 80},
    {"name": "Salmon Dinner", "price": 300},
    {"name": "Fish Taco", "price": 500},
    {"name": "Crispy Bass", "price": 150},
    {"name": "Pepper Poppers", "price": 200},
    {"name": "Bread", "price": 60},
    {"name": "Tom Kha Soup", "price": 250},
    {"name": "Trout Soup", "price": 100},
    {"name": "Chocolate Cake", "price": 200},
    {"name": "Pink Cake", "price": 480},
    {"name": "Rhubarb Pie", "price": 400},
    {"name": "Cookie", "price": 140},
    {"name": "Spaghetti", "price": 120},
    {"name": "Fried Eel", "price": 120},
    {"name": "Spicy Eel", "price": 175},
    {"name": "Sashimi", "price": 75},
    {"name": "Maki Roll", "price": 220},
    {"name": "Tortilla", "price": 50},
    {"name": "Red Plate", "price": 400},
    {"name": "Eggplant Parmesan", "price": 200},
    {"name": "Rice Pudding", "price": 260},
    {"name": "Ice Cream", "price": 120},
    {"name": "Blueberry Tart", "price": 150},
    {"name": "Autumn's Bounty", "price": 350},
    {"name": "Pumpkin Soup", "price": 300},
    {"name": "Super Meal", "price": 220},
    {"name": "Cranberry Sauce", "price": 120},
    {"name": "Stuffing", "price": 165},
    {"name": "Farmer's Lunch", "price": 150},
    {"name": "Survival Burger", "price": 180},
    {"name": "Dish O' The Sea", "price": 220},
    {"name": "Miner's Treat", "price": 200},
    {"name": "Roots Platter", "price": 100},
    {"name": "Triple Shot Espresso", "price": 450},
    {"name": "Seafoam Pudding", "price": 300},
    {"name": "Algae Soup", "price": 100},
    {"name": "Pale Broth", "price": 150},
    {"name": "Plum Pudding", "price": 260},
    {"name": "Artichoke Dip", "price": 210},
    {"name": "Stir Fry", "price": 335},
    {"name": "Roasted Hazelnuts", "price": 270},
    {"name": "Pumpkin Pie", "price": 385},
    {"name": "Radish Salad", "price": 300},
    {"name": "Fruit Salad", "price": 450},
    {"name": "Blackberry Cobbler", "price": 260},
    # Cranberry Candy already exists
    {"name": "Bruschetta", "price": 210},
    {"name": "Coleslaw", "price": 345},
    {"name": "Fiddlehead Risotto", "price": 350},
    {"name": "Poppyseed Muffin", "price": 250},
    {"name": "Chowder", "price": 135},
    {"name": "Fish Stew", "price": 175},
    {"name": "Escargot", "price": 125},
    {"name": "Lobster Bisque", "price": 205},
    {"name": "Maple Bar", "price": 300},
    {"name": "Crab Cakes", "price": 275},
    {"name": "Shrimp Cocktail", "price": 160},
    {"name": "Ginger Ale", "price": 200},
    {"name": "Banana Pudding", "price": 260},
    {"name": "Mango Sticky Rice", "price": 250},
    {"name": "Poi", "price": 400},
    {"name": "Tropical Curry", "price": 500},
    {"name": "Squid Ink Ravioli", "price": 150},
    {"name": "Moss Soup", "price": 80},
]

# ── Cooking recipes ─────────────────────────────────────────────────────

# Each recipe: (base, product_name, ingredients_list)
# base is either a string (single ingredient) or a list of strings (multi-ingredient)
# For single-ingredient recipes, base is the ingredient name
# For multi-ingredient recipes, base is a list of unique ingredient names

COOKING_RECIPES = [
    # Single ingredient recipes
    ("Egg", "Fried Egg", [("Egg", 1)]),
    ("Green Bean", "Bean Hotpot", [("Green Bean", 2)]),
    ("Carp", "Carp Surprise", [("Carp", 4)]),
    ("Wheat Flour", "Bread", [("Wheat Flour", 1)]),
    ("Corn", "Tortilla", [("Corn", 1)]),
    ("Green Algae", "Algae Soup", [("Green Algae", 4)]),
    ("White Algae", "Pale Broth", [("White Algae", 2)]),
    ("Hazelnut", "Roasted Hazelnuts", [("Hazelnut", 3)]),
    ("Taro Root", "Poi", [("Taro Root", 4)]),
    ("Moss", "Moss Soup", [("Moss", 20)]),
    ("Coffee", "Triple Shot Espresso", [("Coffee", 3)]),

    # Two-ingredient recipes
    (["Egg", "Milk"], "Omelet", [("Egg", 1), ("Milk", 1)]),
    (["Cauliflower", "Cheese"], "Cheese Cauliflower", [("Cauliflower", 1), ("Cheese", 1)]),
    (["Tomato", "Beet"], "Vegetable Medley", [("Tomato", 1), ("Beet", 1)]),
    (["Yam", "Sugar"], "Glazed Yams", [("Yam", 1), ("Sugar", 1)]),
    (["Potato", "Oil"], "Hashbrowns", [("Potato", 1), ("Oil", 1)]),
    (["Hot Pepper", "Cheese"], "Pepper Poppers", [("Hot Pepper", 1), ("Cheese", 1)]),
    (["Rainbow Trout", "Green Algae"], "Trout Soup", [("Rainbow Trout", 1), ("Green Algae", 1)]),
    (["Tomato", "Wheat Flour"], "Spaghetti", [("Wheat Flour", 1), ("Tomato", 1)]),
    (["Eel", "Oil"], "Fried Eel", [("Eel", 1), ("Oil", 1)]),
    (["Eel", "Hot Pepper"], "Spicy Eel", [("Eel", 1), ("Hot Pepper", 1)]),
    (["Red Cabbage", "Radish"], "Red Plate", [("Red Cabbage", 1), ("Radish", 1)]),
    (["Eggplant", "Tomato"], "Eggplant Parmesan", [("Eggplant", 1), ("Tomato", 1)]),
    (["Milk", "Sugar"], "Ice Cream", [("Milk", 1), ("Sugar", 1)]),
    (["Yam", "Pumpkin"], "Autumn's Bounty", [("Yam", 1), ("Pumpkin", 1)]),
    (["Pumpkin", "Milk"], "Pumpkin Soup", [("Pumpkin", 1), ("Milk", 1)]),
    (["Cranberries", "Sugar"], "Cranberry Sauce", [("Cranberries", 1), ("Sugar", 1)]),
    (["Wheat Flour", "Egg"], "Pancakes", [("Wheat Flour", 1), ("Egg", 1)]),
    (["Clam", "Milk"], "Chowder", [("Clam", 1), ("Milk", 1)]),
    (["Snail", "Garlic"], "Escargot", [("Snail", 1), ("Garlic", 1)]),
    (["Lobster", "Milk"], "Lobster Bisque", [("Lobster", 1), ("Milk", 1)]),
    (["Artichoke", "Milk"], "Artichoke Dip", [("Artichoke", 1), ("Milk", 1)]),
    (["Cave Carrot", "Winter Root"], "Roots Platter", [("Cave Carrot", 1), ("Winter Root", 1)]),
    (["Omelet", "Parsnip"], "Farmer's Lunch", [("Omelet", 1), ("Parsnip", 1)]),

    # Three-ingredient recipes
    (["Leek", "Dandelion", "Vinegar"], "Salad", [("Leek", 1), ("Dandelion", 1), ("Vinegar", 1)]),
    (["Sunfish", "Bream", "Wheat Flour"], "Baked Fish", [("Sunfish", 1), ("Bream", 1), ("Wheat Flour", 1)]),
    (["Parsnip", "Milk", "Vinegar"], "Parsnip Soup", [("Parsnip", 1), ("Milk", 1), ("Vinegar", 1)]),
    (["Squid", "Wheat Flour", "Oil"], "Fried Calamari", [("Squid", 1), ("Wheat Flour", 1), ("Oil", 1)]),
    (["Wheat Flour", "Periwinkle", "Void Mayonnaise"], "Strange Bun", [("Wheat Flour", 1), ("Periwinkle", 1), ("Void Mayonnaise", 1)]),
    (["Sea Cucumber", "Tortilla", "Blue Jazz"], "Lucky Lunch", [("Sea Cucumber", 1), ("Tortilla", 1), ("Blue Jazz", 1)]),
    (["Common Mushroom", "Morel", "Oil"], "Fried Mushroom", [("Common Mushroom", 1), ("Morel", 1), ("Oil", 1)]),
    (["Wheat Flour", "Tomato", "Cheese"], "Pizza", [("Wheat Flour", 1), ("Tomato", 1), ("Cheese", 1)]),
    (["Salmon", "Amaranth", "Kale"], "Salmon Dinner", [("Salmon", 1), ("Amaranth", 1), ("Kale", 1)]),
    (["Largemouth Bass", "Wheat Flour", "Oil"], "Crispy Bass", [("Largemouth Bass", 1), ("Wheat Flour", 1), ("Oil", 1)]),
    (["Coconut", "Shrimp", "Common Mushroom"], "Tom Kha Soup", [("Coconut", 1), ("Shrimp", 1), ("Common Mushroom", 1)]),
    (["Wheat Flour", "Sugar", "Egg"], "Chocolate Cake", [("Wheat Flour", 1), ("Sugar", 1), ("Egg", 1)]),
    (["Rhubarb", "Wheat Flour", "Sugar"], "Rhubarb Pie", [("Rhubarb", 1), ("Wheat Flour", 1), ("Sugar", 1)]),
    (["Wheat Flour", "Sugar", "Egg"], "Cookie", [("Wheat Flour", 1), ("Sugar", 1), ("Egg", 1)]),
    (["Milk", "Sugar", "Rice"], "Rice Pudding", [("Milk", 1), ("Sugar", 1), ("Rice", 1)]),
    (["Bok Choy", "Cranberries", "Artichoke"], "Super Meal", [("Bok Choy", 1), ("Cranberries", 1), ("Artichoke", 1)]),
    (["Bread", "Cranberries", "Hazelnut"], "Stuffing", [("Bread", 1), ("Cranberries", 1), ("Hazelnut", 1)]),
    (["Bread", "Cave Carrot", "Eggplant"], "Survival Burger", [("Bread", 1), ("Cave Carrot", 1), ("Eggplant", 1)]),
    (["Bread", "Oil", "Tomato"], "Bruschetta", [("Bread", 1), ("Oil", 1), ("Tomato", 1)]),
    (["Blueberry", "Melon", "Apricot"], "Fruit Salad", [("Blueberry", 1), ("Melon", 1), ("Apricot", 1)]),
    (["Cranberries", "Apple", "Sugar"], "Cranberry Candy", [("Cranberries", 1), ("Apple", 1), ("Sugar", 1)]),
    (["Oil", "Fiddlehead Fern", "Garlic"], "Fiddlehead Risotto", [("Oil", 1), ("Fiddlehead Fern", 1), ("Garlic", 1)]),
    (["Poppy", "Wheat Flour", "Sugar"], "Poppyseed Muffin", [("Poppy", 1), ("Wheat Flour", 1), ("Sugar", 1)]),
    (["Maple Syrup", "Sugar", "Wheat Flour"], "Maple Bar", [("Maple Syrup", 1), ("Sugar", 1), ("Wheat Flour", 1)]),
    (["Flounder", "Midnight Carp", "Squid Ink"], "Seafoam Pudding", [("Flounder", 1), ("Midnight Carp", 1), ("Squid Ink", 1)]),
    (["Oil", "Vinegar", "Radish"], "Radish Salad", [("Oil", 1), ("Vinegar", 1), ("Radish", 1)]),
    (["Coconut", "Pineapple", "Hot Pepper"], "Tropical Curry", [("Coconut", 1), ("Pineapple", 1), ("Hot Pepper", 1)]),
    (["Squid Ink", "Wheat Flour", "Tomato"], "Squid Ink Ravioli", [("Squid Ink", 1), ("Wheat Flour", 1), ("Tomato", 1)]),
    (["Banana", "Milk", "Sugar"], "Banana Pudding", [("Banana", 1), ("Milk", 1), ("Sugar", 1)]),
    (["Mango", "Coconut", "Rice"], "Mango Sticky Rice", [("Mango", 1), ("Coconut", 1), ("Rice", 1)]),
    (["Tomato", "Shrimp", "Wild Horseradish"], "Shrimp Cocktail", [("Tomato", 1), ("Shrimp", 1), ("Wild Horseradish", 1)]),
    (["Red Cabbage", "Vinegar", "Mayonnaise"], "Coleslaw", [("Red Cabbage", 1), ("Vinegar", 1), ("Mayonnaise", 1)]),
    (["Ginger", "Sugar"], "Ginger Ale", [("Ginger", 3), ("Sugar", 1)]),

    # Four-ingredient recipes
    (["Fried Egg", "Milk", "Hashbrowns", "Pancakes"], "Complete Breakfast", [("Fried Egg", 1), ("Milk", 1), ("Hashbrowns", 1), ("Pancakes", 1)]),
    (["Tuna", "Tortilla", "Red Cabbage", "Mayonnaise"], "Fish Taco", [("Tuna", 1), ("Tortilla", 1), ("Red Cabbage", 1), ("Mayonnaise", 1)]),
    (["Melon", "Wheat Flour", "Sugar", "Egg"], "Pink Cake", [("Melon", 1), ("Wheat Flour", 1), ("Sugar", 1), ("Egg", 1)]),
    (["Blueberry", "Wheat Flour", "Sugar", "Egg"], "Blueberry Tart", [("Blueberry", 1), ("Wheat Flour", 1), ("Sugar", 1), ("Egg", 1)]),
    (["Sardine", "Hashbrowns"], "Dish O' The Sea", [("Sardine", 2), ("Hashbrowns", 1)]),
    (["Cave Carrot", "Sugar", "Milk"], "Miner's Treat", [("Cave Carrot", 2), ("Sugar", 1), ("Milk", 1)]),
    (["Wild Plum", "Wheat Flour", "Sugar"], "Plum Pudding", [("Wild Plum", 2), ("Wheat Flour", 1), ("Sugar", 1)]),
    (["Cave Carrot", "Common Mushroom", "Kale", "Oil"], "Stir Fry", [("Cave Carrot", 1), ("Common Mushroom", 1), ("Kale", 1), ("Oil", 1)]),
    (["Pumpkin", "Wheat Flour", "Milk", "Sugar"], "Pumpkin Pie", [("Pumpkin", 1), ("Wheat Flour", 1), ("Milk", 1), ("Sugar", 1)]),
    (["Blackberry", "Sugar", "Wheat Flour"], "Blackberry Cobbler", [("Blackberry", 2), ("Sugar", 1), ("Wheat Flour", 1)]),
    (["Crab", "Wheat Flour", "Egg", "Oil"], "Crab Cakes", [("Crab", 1), ("Wheat Flour", 1), ("Egg", 1), ("Oil", 1)]),
    (["Crayfish", "Mussel", "Periwinkle", "Tomato"], "Fish Stew", [("Crayfish", 1), ("Mussel", 1), ("Periwinkle", 1), ("Tomato", 1)]),

    # Category-based recipes (Any Fish)
    # Sashimi: Any Fish x1 -> 75g
    # Maki Roll: Any Fish x1 + Seaweed x1 + Rice x1 -> 220g
    # These are handled specially below
]

# ── Sprite URLs from wiki ───────────────────────────────────────────────

SPRITE_URLS = {
    "Fried Egg": "/mediawiki/images/1/18/Fried_Egg.png",
    "Omelet": "/mediawiki/images/1/12/Omelet.png",
    "Salad": "/mediawiki/images/7/7e/Salad.png",
    "Cheese Cauliflower": "/mediawiki/images/6/6e/Cheese_Cauliflower.png",
    "Baked Fish": "/mediawiki/images/9/94/Baked_Fish.png",
    "Parsnip Soup": "/mediawiki/images/7/76/Parsnip_Soup.png",
    "Vegetable Medley": "/mediawiki/images/0/0a/Vegetable_Medley.png",
    "Complete Breakfast": "/mediawiki/images/3/3d/Complete_Breakfast.png",
    "Fried Calamari": "/mediawiki/images/2/25/Fried_Calamari.png",
    "Strange Bun": "/mediawiki/images/5/5e/Strange_Bun.png",
    "Lucky Lunch": "/mediawiki/images/5/5d/Lucky_Lunch.png",
    "Fried Mushroom": "/mediawiki/images/4/4a/Fried_Mushroom.png",
    "Pizza": "/mediawiki/images/f/f4/Pizza.png",
    "Bean Hotpot": "/mediawiki/images/2/24/Bean_Hotpot.png",
    "Glazed Yams": "/mediawiki/images/3/30/Glazed_Yams.png",
    "Carp Surprise": "/mediawiki/images/c/cc/Carp_Surprise.png",
    "Hashbrowns": "/mediawiki/images/8/8f/Hashbrowns.png",
    "Pancakes": "/mediawiki/images/6/6b/Pancakes.png",
    "Salmon Dinner": "/mediawiki/images/8/8b/Salmon_Dinner.png",
    "Fish Taco": "/mediawiki/images/d/d5/Fish_Taco.png",
    "Crispy Bass": "/mediawiki/images/5/53/Crispy_Bass.png",
    "Pepper Poppers": "/mediawiki/images/0/08/Pepper_Poppers.png",
    "Bread": "/mediawiki/images/e/e1/Bread.png",
    "Tom Kha Soup": "/mediawiki/images/3/3b/Tom_Kha_Soup.png",
    "Trout Soup": "/mediawiki/images/4/48/Trout_Soup.png",
    "Chocolate Cake": "/mediawiki/images/8/87/Chocolate_Cake.png",
    "Pink Cake": "/mediawiki/images/3/32/Pink_Cake.png",
    "Rhubarb Pie": "/mediawiki/images/2/21/Rhubarb_Pie.png",
    "Cookie": "/mediawiki/images/7/70/Cookie.png",
    "Spaghetti": "/mediawiki/images/0/08/Spaghetti.png",
    "Fried Eel": "/mediawiki/images/8/84/Fried_Eel.png",
    "Spicy Eel": "/mediawiki/images/f/f2/Spicy_Eel.png",
    "Sashimi": "/mediawiki/images/4/41/Sashimi.png",
    "Maki Roll": "/mediawiki/images/b/b6/Maki_Roll.png",
    "Tortilla": "/mediawiki/images/d/d7/Tortilla.png",
    "Red Plate": "/mediawiki/images/4/45/Red_Plate.png",
    "Eggplant Parmesan": "/mediawiki/images/7/73/Eggplant_Parmesan.png",
    "Rice Pudding": "/mediawiki/images/e/ec/Rice_Pudding.png",
    "Ice Cream": "/mediawiki/images/5/5d/Ice_Cream.png",
    "Blueberry Tart": "/mediawiki/images/9/9b/Blueberry_Tart.png",
    "Autumn's Bounty": "/mediawiki/images/f/f4/Autumn%27s_Bounty.png",
    "Pumpkin Soup": "/mediawiki/images/5/59/Pumpkin_Soup.png",
    "Super Meal": "/mediawiki/images/d/d2/Super_Meal.png",
    "Cranberry Sauce": "/mediawiki/images/0/0b/Cranberry_Sauce.png",
    "Stuffing": "/mediawiki/images/9/9a/Stuffing.png",
    "Farmer's Lunch": "/mediawiki/images/7/79/Farmer%27s_Lunch.png",
    "Survival Burger": "/mediawiki/images/8/87/Survival_Burger.png",
    "Dish O' The Sea": "/mediawiki/images/f/ff/Dish_O%27_The_Sea.png",
    "Miner's Treat": "/mediawiki/images/1/12/Miner%27s_Treat.png",
    "Roots Platter": "/mediawiki/images/e/e0/Roots_Platter.png",
    "Triple Shot Espresso": "/mediawiki/images/3/36/Triple_Shot_Espresso.png",
    "Seafoam Pudding": "/mediawiki/images/3/33/Seafoam_Pudding.png",
    "Algae Soup": "/mediawiki/images/5/53/Algae_Soup.png",
    "Pale Broth": "/mediawiki/images/7/7e/Pale_Broth.png",
    "Plum Pudding": "/mediawiki/images/a/a0/Plum_Pudding.png",
    "Artichoke Dip": "/mediawiki/images/7/77/Artichoke_Dip.png",
    "Stir Fry": "/mediawiki/images/e/ed/Stir_Fry.png",
    "Roasted Hazelnuts": "/mediawiki/images/1/18/Roasted_Hazelnuts.png",
    "Pumpkin Pie": "/mediawiki/images/7/7d/Pumpkin_Pie.png",
    "Radish Salad": "/mediawiki/images/b/b9/Radish_Salad.png",
    "Fruit Salad": "/mediawiki/images/9/9e/Fruit_Salad.png",
    "Blackberry Cobbler": "/mediawiki/images/7/70/Blackberry_Cobbler.png",
    "Cranberry Candy": "/mediawiki/images/9/9d/Cranberry_Candy.png",
    "Bruschetta": "/mediawiki/images/c/ca/Bruschetta.png",
    "Coleslaw": "/mediawiki/images/e/e1/Coleslaw.png",
    "Fiddlehead Risotto": "/mediawiki/images/2/2d/Fiddlehead_Risotto.png",
    "Poppyseed Muffin": "/mediawiki/images/8/8e/Poppyseed_Muffin.png",
    "Chowder": "/mediawiki/images/9/95/Chowder.png",
    "Fish Stew": "/mediawiki/images/6/6f/Fish_Stew.png",
    "Escargot": "/mediawiki/images/7/78/Escargot.png",
    "Lobster Bisque": "/mediawiki/images/0/0a/Lobster_Bisque.png",
    "Maple Bar": "/mediawiki/images/1/18/Maple_Bar.png",
    "Crab Cakes": "/mediawiki/images/7/70/Crab_Cakes.png",
    "Shrimp Cocktail": "/mediawiki/images/8/8e/Shrimp_Cocktail.png",
    "Ginger Ale": "/mediawiki/images/1/1a/Ginger_Ale.png",
    "Banana Pudding": "/mediawiki/images/4/40/Banana_Pudding.png",
    "Mango Sticky Rice": "/mediawiki/images/6/6e/Mango_Sticky_Rice.png",
    "Poi": "/mediawiki/images/f/f1/Poi.png",
    "Tropical Curry": "/mediawiki/images/3/32/Tropical_Curry.png",
    "Squid Ink Ravioli": "/mediawiki/images/8/86/Squid_Ink_Ravioli.png",
    "Moss Soup": "/mediawiki/images/d/df/Moss_Soup.png",
}


def slug(name):
    """Convert item name to sprite filename slug."""
    return name.lower().replace("'", "").replace(" ", "-")


def main():
    # Load current data
    with open(ITEMS_PATH) as f:
        items_data = json.load(f)
    with open(RECIPES_PATH) as f:
        recipes_data = json.load(f)

    existing_names = {item["name"] for item in items_data["items"]}
    existing_recipe_products = set()
    for recipe in recipes_data["recipes"]:
        for product in recipe["products"]:
            existing_recipe_products.add(product["name"])

    # Add new base items
    added_items = []
    for item in NEW_BASE_ITEMS:
        if item["name"] not in existing_names:
            items_data["items"].append(item)
            existing_names.add(item["name"])
            added_items.append(item["name"])

    # Add cooked items
    for cooked in COOKED_ITEMS:
        if cooked["name"] not in existing_names:
            sprite_path = f"/sprites/food/{slug(cooked['name'])}.png"
            item_entry = {
                "name": cooked["name"],
                "category": "cooked",
                "base": False,
                "prices": {
                    "base": {"normal": cooked["price"]}
                },
                "spritePath": sprite_path,
            }
            items_data["items"].append(item_entry)
            existing_names.add(cooked["name"])
            added_items.append(cooked["name"])
        else:
            # Update existing cooked item to have spritePath if missing
            for item in items_data["items"]:
                if item["name"] == cooked["name"] and "spritePath" not in item:
                    item["spritePath"] = f"/sprites/food/{slug(cooked['name'])}.png"

    # Sort items alphabetically
    items_data["items"].sort(key=lambda x: x["name"])

    # Add cooking recipes
    added_recipes = []
    for base, product_name, ingredients in COOKING_RECIPES:
        # Skip if this exact product already exists in recipes
        # (Cranberry Candy was already added)
        already_exists = False
        for recipe in recipes_data["recipes"]:
            for product in recipe["products"]:
                if product["name"] == product_name:
                    already_exists = True
                    break
            if already_exists:
                break
        if already_exists:
            continue

        ingredients_list = [{"name": name, "quantity": qty} for name, qty in ingredients]

        # Determine base field
        if isinstance(base, list):
            recipe_base = base
        else:
            recipe_base = base

        recipe_entry = {
            "base": recipe_base,
            "products": [
                {
                    "name": product_name,
                    "processor": "Kitchen",
                    "ingredients": ingredients_list,
                }
            ],
        }
        recipes_data["recipes"].append(recipe_entry)
        added_recipes.append(product_name)

    # Add category-based recipes (Sashimi, Maki Roll)
    # Check if they already exist
    sashimi_exists = any(
        any(p["name"] == "Sashimi" for p in r["products"])
        for r in recipes_data["recipes"]
    )
    if not sashimi_exists:
        recipes_data["recipes"].append({
            "base": {"category": "fish"},
            "products": [
                {
                    "name": "Sashimi",
                    "processor": "Kitchen",
                    "ingredients": [{"name": "{input}", "quantity": 1}],
                },
            ],
        })
        added_recipes.append("Sashimi")

    maki_exists = any(
        any(p["name"] == "Maki Roll" for p in r["products"])
        for r in recipes_data["recipes"]
    )
    if not maki_exists:
        recipes_data["recipes"].append({
            "base": {"category": "fish"},
            "products": [
                {
                    "name": "Maki Roll",
                    "processor": "Kitchen",
                    "ingredients": [
                        {"name": "{input}", "quantity": 1},
                        {"name": "Seaweed", "quantity": 1},
                        {"name": "Rice", "quantity": 1},
                    ],
                },
            ],
        })
        added_recipes.append("Maki Roll")

    # Write updated files
    with open(ITEMS_PATH, "w") as f:
        json.dump(items_data, f, indent=4)
        f.write("\n")

    with open(RECIPES_PATH, "w") as f:
        json.dump(recipes_data, f, indent=4)
        f.write("\n")

    print(f"Added {len(added_items)} new items")
    print(f"Added {len(added_recipes)} new recipes")

    # Download sprites
    os.makedirs(SPRITES_DIR, exist_ok=True)
    downloaded = 0
    skipped = 0
    failed = 0

    for name, url_path in SPRITE_URLS.items():
        filename = f"{slug(name)}.png"
        filepath = os.path.join(SPRITES_DIR, filename)

        if os.path.exists(filepath):
            skipped += 1
            continue

        url = f"{WIKI_BASE}{url_path}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "DewI-Bot/1.0 (Stardew Valley reference tool)"})
            with urllib.request.urlopen(req) as response:
                with open(filepath, "wb") as out:
                    out.write(response.read())
            downloaded += 1
            print(f"  Downloaded: {filename}")
            time.sleep(0.2)  # Be nice to the wiki
        except Exception as e:
            print(f"  FAILED: {filename} - {e}")
            failed += 1

    print(f"\nSprites: {downloaded} downloaded, {skipped} skipped (exist), {failed} failed")


if __name__ == "__main__":
    main()
