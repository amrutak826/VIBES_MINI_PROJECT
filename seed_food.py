from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client.vibes
foods = db.foods

sample_data = [
    {
        "name": "Pizza",
        "category": "Fast Food",
        "prices": {"swiggy": 240, "zomato": 220, "ubereats": 250}
    },
    {
        "name": "Burger",
        "category": "Fast Food",
        "prices": {"swiggy": 120, "zomato": 100, "ubereats": 130}
    },
    {
        "name": "Pasta",
        "category": "Italian",
        "prices": {"swiggy": 200, "zomato": 210, "ubereats": 205}
    }
]

foods.delete_many({})
foods.insert_many(sample_data)
print("Food data seeded!")