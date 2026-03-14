#!/usr/bin/env python3
"""
Add energy, health, and buff data to cooked items in items.json.
Data sourced from: https://stardewvalleywiki.com/Cooking#Recipes
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ITEMS_JSON = BASE_DIR / "data" / "items.json"


def mins(m, s=0):
    """Convert minutes and seconds to total seconds."""
    return m * 60 + s


# Food effects: { "Item Name": { "energy": N, "health": N, "buffs": [...] } }
# Buffs format: [{"name": "...", "amount": N, "duration": seconds}, ...]
DESCRIPTIONS = {
    "Algae Soup":           "It's a little slimy.",
    "Artichoke Dip":        "It's cool and refreshing.",
    "Autumn's Bounty":      "A taste of the season.",
    "Baked Fish":           "Baked fish on a bed of herbs.",
    "Banana Pudding":       "A creamy dessert with a wonderful tropical flavor.",
    "Bean Hotpot":          "It sure is healthy.",
    "Blackberry Cobbler":   "There's nothing quite like it.",
    "Blueberry Tart":       "It's subtle and refreshing.",
    "Bread":                "A crusty baguette.",
    "Bruschetta":           "Roasted tomatoes on a crisp white bread.",
    "Carp Surprise":        "It's bland and oily.",
    "Cheese Cauliflower":   "It smells great!",
    "Chocolate Cake":       "Rich and moist with a thick fudge icing.",
    "Chowder":              "A perfect way to warm yourself after a cold night at sea.",
    "Coleslaw":             "It's light, fresh and very healthy.",
    "Complete Breakfast":   "You'll feel ready to take on the world!",
    "Cookie":               "Very chewy.",
    "Crab Cakes":           "Crab, bread crumbs, and egg formed into patties then fried to a golden brown.",
    "Cranberry Candy":      "It's sweet enough to mask the bitter fruit.",
    "Cranberry Sauce":      "A festive treat.",
    "Crispy Bass":          "Wow, the breading is perfect.",
    "Dish O' The Sea":      "This'll keep you warm in the cold sea air.",
    "Eggplant Parmesan":    "Tangy, cheesy, and wonderful.",
    "Escargot":             "Butter-soaked snails cooked to perfection.",
    "Farmer's Lunch":       "This'll keep you going.",
    "Fiddlehead Risotto":   "A creamy rice dish served with sauteed fern heads. It's a little bland.",
    "Fish Stew":            "It smells a lot like the sea. Tastes better, though.",
    "Fish Taco":            "It smells delicious.",
    "Fried Calamari":       "It's so chewy.",
    "Fried Eel":            "Greasy but flavorful.",
    "Fried Egg":            "Sunny-side up.",
    "Fried Mushroom":       "Earthy and aromatic.",
    "Fruit Salad":          "A delicious combination of summer fruits.",
    "Ginger Ale":           "A zesty soda known for its soothing effect on the stomach.",
    "Glazed Yams":          "Sweet and satisfying... The sugar gives it a hint of caramel.",
    "Hashbrowns":           "Crispy and golden-brown!",
    "Ice Cream":            "It's hard to find someone who doesn't like this.",
    "Lobster Bisque":       "This delicate soup is a secret family recipe of Willy's.",
    "Lucky Lunch":          "A special little meal.",
    "Maki Roll":            "Fish and rice wrapped in seaweed.",
    "Mango Sticky Rice":    "Sweet mango and coconut transforms this rice into something very special.",
    "Maple Bar":            "It's a sweet doughnut topped with a rich maple glaze.",
    "Miner's Treat":        "This should keep your energy up.",
    "Moss Soup":            "It's thick and slimy, but edible.",
    "Omelet":               "It's super fluffy.",
    "Pale Broth":           "A delicate broth with a hint of sulfur.",
    "Pancakes":             "A double stack of fluffy, soft pancakes.",
    "Parsnip Soup":         "It's fresh and hearty.",
    "Pepper Poppers":       "Spicy breaded peppers filled with cheese.",
    "Pink Cake":            "There's little heart candies on top.",
    "Pizza":                "It's popular for all the right reasons.",
    "Plum Pudding":         "A traditional holiday treat.",
    "Poi":                  "A traditional food with a delicate, sweet flavor when eaten fresh.",
    "Poppyseed Muffin":     "It has a soothing effect.",
    "Pumpkin Pie":          "Silky pumpkin cream in a flaky crust.",
    "Pumpkin Soup":         "A seasonal favorite.",
    "Radish Salad":         "The radishes are so crisp!",
    "Red Plate":            "Full of antioxidants.",
    "Rhubarb Pie":          "Mmm, tangy and sweet!",
    "Rice Pudding":         "It's creamy, sweet, and fun to eat.",
    "Roasted Hazelnuts":    "The roasting process creates a rich forest flavor.",
    "Roots Platter":        "This'll get you digging for more.",
    "Salad":                "A healthy garden salad.",
    "Salmon Dinner":        "The lemon spritz makes it special.",
    "Sashimi":              "Raw fish sliced into thin pieces.",
    "Seafoam Pudding":      "This briny pudding will really get you into the maritime mindset!",
    "Shrimp Cocktail":      "A sumptuous appetizer made with freshly-caught shrimp.",
    "Spaghetti":            "An old favorite.",
    "Spicy Eel":            "It's really spicy! Be careful.",
    "Squid Ink Ravioli":    "Temporarily protects from debuffs.",
    "Stir Fry":             "Julienned vegetables on a bed of rice.",
    "Strange Bun":          "What's inside?",
    "Stuffing":             "Ahh... the smell of warm bread and sage.",
    "Super Meal":           "It's a really energizing meal.",
    "Survival Burger":      "A convenient snack for the explorer.",
    "Tom Kha Soup":         "These flavors are incredible!",
    "Tortilla":             "Can be used as a vessel for food or eaten by itself.",
    "Triple Shot Espresso": "It's more potent than regular coffee!",
    "Tropical Curry":       "An exotic, fragrant curry served in a pineapple bowl.",
    "Trout Soup":           "Pretty salty.",
    "Vegetable Medley":     "This is very nutritious.",
}

# Food effects: { "Item Name": { "energy": N, "health": N, "buffs": [...] } }
# Buffs format: [{"name": "...", "amount": N, "duration": seconds}, ...]
FOOD_EFFECTS = {
    "Algae Soup":            {"energy": 75,  "health": 33},
    "Artichoke Dip":         {"energy": 100, "health": 45},
    "Autumn's Bounty":       {"energy": 220, "health": 99,  "buffs": [{"name": "Foraging", "amount": 2, "duration": mins(7, 41)}, {"name": "Defense", "amount": 2, "duration": mins(7, 41)}]},
    "Baked Fish":            {"energy": 75,  "health": 33},
    "Banana Pudding":        {"energy": 125, "health": 56,  "buffs": [{"name": "Mining", "amount": 1, "duration": mins(5, 1)}, {"name": "Luck", "amount": 1, "duration": mins(5, 1)}, {"name": "Defense", "amount": 1, "duration": mins(5, 1)}]},
    "Bean Hotpot":           {"energy": 125, "health": 56,  "buffs": [{"name": "Max Energy", "amount": 30, "duration": mins(7)}, {"name": "Magnetism", "amount": 32, "duration": mins(7)}]},
    "Blackberry Cobbler":    {"energy": 175, "health": 78},
    "Blueberry Tart":        {"energy": 125, "health": 56},
    "Bread":                 {"energy": 50,  "health": 22},
    "Bruschetta":            {"energy": 113, "health": 50},
    "Carp Surprise":         {"energy": 90,  "health": 40},
    "Cheese Cauliflower":    {"energy": 138, "health": 62},
    "Chocolate Cake":        {"energy": 150, "health": 67},
    "Chowder":               {"energy": 225, "health": 101, "buffs": [{"name": "Fishing", "amount": 1, "duration": mins(16, 47)}]},
    "Coleslaw":              {"energy": 213, "health": 95},
    "Complete Breakfast":    {"energy": 200, "health": 90,  "buffs": [{"name": "Farming", "amount": 2, "duration": mins(7)}, {"name": "Max Energy", "amount": 50, "duration": mins(7)}]},
    "Cookie":                {"energy": 90,  "health": 40},
    "Crab Cakes":            {"energy": 225, "health": 101, "buffs": [{"name": "Speed", "amount": 1, "duration": mins(16, 47)}, {"name": "Defense", "amount": 1, "duration": mins(16, 47)}]},
    "Cranberry Candy":       {"energy": 125, "health": 56},
    "Cranberry Sauce":       {"energy": 125, "health": 56,  "buffs": [{"name": "Mining", "amount": 2, "duration": mins(3, 30)}]},
    "Crispy Bass":           {"energy": 90,  "health": 40,  "buffs": [{"name": "Magnetism", "amount": 64, "duration": mins(7)}]},
    "Dish O' The Sea":       {"energy": 150, "health": 67,  "buffs": [{"name": "Fishing", "amount": 3, "duration": mins(5, 35)}]},
    "Eggplant Parmesan":     {"energy": 175, "health": 78,  "buffs": [{"name": "Mining", "amount": 1, "duration": mins(4, 39)}, {"name": "Defense", "amount": 3, "duration": mins(4, 39)}]},
    "Escargot":              {"energy": 225, "health": 101, "buffs": [{"name": "Fishing", "amount": 2, "duration": mins(16, 47)}]},
    "Farmer's Lunch":        {"energy": 200, "health": 90,  "buffs": [{"name": "Farming", "amount": 3, "duration": mins(5, 35)}]},
    "Fiddlehead Risotto":    {"energy": 225, "health": 101},
    "Fish Stew":             {"energy": 225, "health": 101, "buffs": [{"name": "Fishing", "amount": 3, "duration": mins(16, 47)}]},
    "Fish Taco":             {"energy": 165, "health": 74,  "buffs": [{"name": "Fishing", "amount": 2, "duration": mins(7)}]},
    "Fried Calamari":        {"energy": 80,  "health": 36},
    "Fried Eel":             {"energy": 75,  "health": 33,  "buffs": [{"name": "Luck", "amount": 1, "duration": mins(7)}]},
    "Fried Egg":             {"energy": 50,  "health": 22},
    "Fried Mushroom":        {"energy": 135, "health": 60,  "buffs": [{"name": "Attack", "amount": 2, "duration": mins(7)}]},
    "Fruit Salad":           {"energy": 263, "health": 118},
    "Ginger Ale":            {"energy": 63,  "health": 28,  "buffs": [{"name": "Luck", "amount": 1, "duration": mins(5)}]},
    "Glazed Yams":           {"energy": 200, "health": 90},
    "Hashbrowns":            {"energy": 90,  "health": 40,  "buffs": [{"name": "Farming", "amount": 1, "duration": mins(5, 35)}]},
    "Ice Cream":             {"energy": 100, "health": 45},
    "Lobster Bisque":        {"energy": 225, "health": 101, "buffs": [{"name": "Fishing", "amount": 3, "duration": mins(16, 47)}, {"name": "Max Energy", "amount": 50, "duration": mins(16, 47)}]},
    "Lucky Lunch":           {"energy": 100, "health": 45,  "buffs": [{"name": "Luck", "amount": 3, "duration": mins(11, 11)}]},
    "Maki Roll":             {"energy": 100, "health": 45},
    "Mango Sticky Rice":     {"energy": 113, "health": 50,  "buffs": [{"name": "Defense", "amount": 3, "duration": mins(5, 1)}]},
    "Maple Bar":             {"energy": 225, "health": 101, "buffs": [{"name": "Farming", "amount": 1, "duration": mins(16, 47)}, {"name": "Fishing", "amount": 1, "duration": mins(16, 47)}, {"name": "Mining", "amount": 1, "duration": mins(16, 47)}]},
    "Miner's Treat":         {"energy": 125, "health": 56,  "buffs": [{"name": "Mining", "amount": 3, "duration": mins(5, 35)}, {"name": "Magnetism", "amount": 32, "duration": mins(5, 35)}]},
    "Moss Soup":             {"energy": 70,  "health": 31},
    "Omelet":                {"energy": 100, "health": 45},
    "Pale Broth":            {"energy": 125, "health": 56},
    "Pancakes":              {"energy": 90,  "health": 40,  "buffs": [{"name": "Foraging", "amount": 2, "duration": mins(11, 11)}]},
    "Parsnip Soup":          {"energy": 85,  "health": 38},
    "Pepper Poppers":        {"energy": 130, "health": 58,  "buffs": [{"name": "Farming", "amount": 2, "duration": mins(7)}, {"name": "Speed", "amount": 1, "duration": mins(7)}]},
    "Pink Cake":             {"energy": 250, "health": 112},
    "Pizza":                 {"energy": 150, "health": 67},
    "Plum Pudding":          {"energy": 175, "health": 78},
    "Poi":                   {"energy": 75,  "health": 33},
    "Poppyseed Muffin":      {"energy": 150, "health": 67},
    "Pumpkin Pie":           {"energy": 225, "health": 101},
    "Pumpkin Soup":          {"energy": 200, "health": 90,  "buffs": [{"name": "Defense", "amount": 2, "duration": mins(7, 41)}, {"name": "Luck", "amount": 2, "duration": mins(7, 41)}]},
    "Radish Salad":          {"energy": 200, "health": 90},
    "Red Plate":             {"energy": 240, "health": 108, "buffs": [{"name": "Max Energy", "amount": 50, "duration": mins(3, 30)}]},
    "Rhubarb Pie":           {"energy": 215, "health": 96},
    "Rice Pudding":          {"energy": 115, "health": 51},
    "Roasted Hazelnuts":     {"energy": 175, "health": 78},
    "Roots Platter":         {"energy": 125, "health": 56,  "buffs": [{"name": "Attack", "amount": 3, "duration": mins(5, 35)}]},
    "Salad":                 {"energy": 113, "health": 50},
    "Salmon Dinner":         {"energy": 125, "health": 56},
    "Sashimi":               {"energy": 75,  "health": 33},
    "Seafoam Pudding":       {"energy": 175, "health": 78,  "buffs": [{"name": "Fishing", "amount": 4, "duration": mins(3, 30)}]},
    "Shrimp Cocktail":       {"energy": 225, "health": 101, "buffs": [{"name": "Fishing", "amount": 1, "duration": mins(10, 2)}, {"name": "Luck", "amount": 1, "duration": mins(10, 2)}]},
    "Spaghetti":             {"energy": 75,  "health": 33},
    "Spicy Eel":             {"energy": 115, "health": 51,  "buffs": [{"name": "Luck", "amount": 1, "duration": mins(7)}, {"name": "Speed", "amount": 1, "duration": mins(7)}]},
    "Squid Ink Ravioli":     {"energy": 125, "health": 56,  "buffs": [{"name": "Mining", "amount": 1, "duration": mins(4, 39)}]},
    "Stir Fry":              {"energy": 200, "health": 90},
    "Strange Bun":           {"energy": 100, "health": 45},
    "Stuffing":              {"energy": 170, "health": 76,  "buffs": [{"name": "Defense", "amount": 2, "duration": mins(5, 35)}]},
    "Super Meal":            {"energy": 160, "health": 72,  "buffs": [{"name": "Max Energy", "amount": 40, "duration": mins(3, 30)}, {"name": "Speed", "amount": 1, "duration": mins(3, 30)}]},
    "Survival Burger":       {"energy": 125, "health": 56,  "buffs": [{"name": "Foraging", "amount": 3, "duration": mins(5, 35)}]},
    "Tom Kha Soup":          {"energy": 175, "health": 78,  "buffs": [{"name": "Farming", "amount": 2, "duration": mins(7)}, {"name": "Max Energy", "amount": 30, "duration": mins(7)}]},
    "Tortilla":              {"energy": 50,  "health": 22},
    "Triple Shot Espresso":  {"energy": 8,   "health": 3,   "buffs": [{"name": "Speed", "amount": 1, "duration": mins(4, 12)}]},
    "Tropical Curry":        {"energy": 150, "health": 67,  "buffs": [{"name": "Foraging", "amount": 4, "duration": mins(5, 1)}]},
    "Trout Soup":            {"energy": 100, "health": 45,  "buffs": [{"name": "Fishing", "amount": 1, "duration": mins(4, 39)}]},
    "Vegetable Medley":      {"energy": 165, "health": 74},
}


def main():
    with open(ITEMS_JSON) as f:
        data = json.load(f)

    updated = 0
    not_found = []

    for item in data["items"]:
        if item.get("category") != "cooked":
            continue
        name = item["name"]
        effects = FOOD_EFFECTS.get(name)
        if effects is None:
            not_found.append(name)
            continue

        desc = DESCRIPTIONS.get(name)
        if desc:
            item["description"] = desc

        item["energy"] = effects["energy"]
        item["health"] = effects["health"]
        if "buffs" in effects:
            item["buffs"] = effects["buffs"]
        else:
            item.pop("buffs", None)

        updated += 1

    with open(ITEMS_JSON, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    print(f"Updated {updated} cooked items.")
    if not_found:
        print(f"Cooked items in items.json with no food effects data ({len(not_found)}):")
        for name in sorted(not_found):
            print(f"  - {name}")

    missing_from_json = [name for name in FOOD_EFFECTS if not any(i["name"] == name for i in data["items"])]
    if missing_from_json:
        print(f"\nFood effects defined but item not in items.json ({len(missing_from_json)}):")
        for name in sorted(missing_from_json):
            print(f"  - {name}")


if __name__ == "__main__":
    main()
