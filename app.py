from flask import Flask, jsonify, request
import requests, os
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv('TMDB_API_KEY')
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
MONGO_URI = os.getenv('MONGO_URI')

client = MongoClient(MONGO_URI)
db = client.vibes
food_collection = db.foods

spotify_token = None

def get_spotify_access_token():
    global spotify_token
    if spotify_token: return spotify_token
    url = 'https://accounts.spotify.com/api/token'
    auth = (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {'grant_type': 'client_credentials'}
    r = requests.post(url, auth=auth, headers=headers, data=data)
    spotify_token = r.json().get('access_token')
    return spotify_token

@app.route('/movies/popular', methods=['GET'])
def get_popular_movies():
    url = f'https://api.themoviedb.org/3/movie/popular?api_key={TMDB_API_KEY}&language=en-US&page=1'
    r = requests.get(url)
    return jsonify(r.json().get('results', []))

@app.route('/music/recommend', methods=['POST'])
def get_music_recommendation():
    data = request.json
    mood = data.get('mood', 'happy').lower()
    genre = data.get('genre', 'pop').lower()
    token = get_spotify_access_token()
    headers = {'Authorization': f'Bearer {token}'}
    valence = 0.9 if mood == 'happy' else 0.4
    params = {
        'seed_genres': genre,
        'target_valence': valence,
        'limit': 10
    }
    r = requests.get('https://api.spotify.com/v1/recommendations', headers=headers, params=params)
    results = []
    for track in r.json().get('tracks', []):
        name = track['name']
        artist = track['artists'][0]['name']
        query = f"{name} {artist}".replace(" ", "+")
        results.append({
            'title': name,
            'artist': artist,
            'spotifyUrl': track['external_urls']['spotify'],
            'appleMusicUrl': f"https://music.apple.com/in/search?term={query}",
            'amazonMusicUrl': f"https://music.amazon.in/search/{query}",
            'gaanaUrl': f"https://gaana.com/search/{query}"
        })
    return jsonify(results)

@app.route('/food/recommend', methods=['GET'])
def get_food():
    foods = list(food_collection.find({}, {'_id': 0}))
    return jsonify(foods)

@app.route('/food/compare/<item>', methods=['GET'])
def compare_food(item):
    food = food_collection.find_one({'name': {'$regex': f'^{item}$', '$options': 'i'}}, {'_id': 0})
    if not food:
        return jsonify({'error': 'Food item not found'}), 404
    return jsonify(food.get('prices', {}))

if __name__ == '__main__':
    app.run(debug=True)