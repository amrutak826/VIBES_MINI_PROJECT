import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "@/entities/User";
import { UserPreference } from "@/entities/UserPreference";
import { MusicRecommendation } from "@/entities/MusicRecommendation";
import { InvokeLLM } from "@/integrations/Core";
import MoodSelector from "../components/ui/mood-selector";
import GenreSelector from "../components/ui/genre-selector";
import RecommendationCard from "../components/ui/recommendation-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  FilterX,
  ThumbsUp,
  ThumbsDown,
  Play
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MusicPage() {
  const [user, setUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentTab, setCurrentTab] = useState("mood");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  
  // Available moods and genres for music
  const moods = ["happy", "sad", "relaxed", "energetic", "focused", "romantic"];
  const genres = ["pop", "rock", "hip-hop", "electronic", "jazz", "classical", "r&b", "indie", "metal", "folk"];
  
  // Fetch user data and preferences on load
  useEffect(() => {
    async function fetchUserData() {
      try {
        const userData = await User.me();
        setUser(userData);
        
        // Try to fetch user preferences
        const preferences = await UserPreference.filter({ created_by: userData.email });
        if (preferences.length > 0) {
          setUserPreferences(preferences[0]);
          // If user has preferred genres, preselect up to 3
          if (preferences[0].favorite_music_genres?.length > 0) {
            setSelectedGenres(preferences[0].favorite_music_genres.slice(0, 3));
          }
        }
      } catch (error) {
        console.log("User not logged in or error fetching data", error);
      }
    }
    
    fetchUserData();
  }, []);
  
  // Get music recommendations
  const getRecommendations = async () => {
    if (!selectedMood && selectedGenres.length === 0) {
      // Need at least mood or a genre
      return;
    }
    
    setLoading(true);
    
    try {
      // First try to get from our database
      let musicRecs;
      
      if (selectedMood && selectedGenres.length > 0) {
        // Filter by both mood and genre
        musicRecs = await MusicRecommendation.filter({
          mood: selectedMood,
          genre: { $in: selectedGenres }
        });
      } else if (selectedMood) {
        // Only filter by mood
        musicRecs = await MusicRecommendation.filter({ mood: selectedMood });
      } else {
        // Only filter by genres
        musicRecs = await MusicRecommendation.filter({
          genre: { $in: selectedGenres }
        });
      }
      
      // If we don't have enough recommendations in our database, generate more
      if (musicRecs.length < 5) {
        await generateMusicRecommendations();
      } else {
        setRecommendations(musicRecs);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      await generateMusicRecommendations();
    }
    
    setLoading(false);
  };
  
  // Generate music recommendations using LLM
  const generateMusicRecommendations = async () => {
    try {
      const prompt = `
        Generate 10 music recommendations for a user who is feeling ${selectedMood || "any mood"} 
        and likes the following genres: ${selectedGenres.join(", ") || "all genres"}.
        
        For each song, include:
        - Song title
        - Artist name
        - Year released (between 1970 and 2023)
        - The mood it matches
        - The primary genre
        - A BPM (beats per minute) value
        - On which platforms it might be available (spotify, apple, youtube, amazon, gaana)
        
        Make sure the recommendations are diverse and actually match the requested mood and genres.
      `;
      
      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  artist: { type: "string" },
                  year: { type: "number" },
                  mood: { type: "string" },
                  genre: { type: "string" },
                  bpm: { type: "number" },
                  platforms: { 
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });
      
      if (result && result.recommendations) {
        // Transform the results and add image URLs
        const transformedRecs = result.recommendations.map(song => ({
          ...song,
          image_url: https://source.unsplash.com/random/500x500/?music,album,${song.genre},
        }));
        
        // Save to our database for future use
        try {
          await MusicRecommendation.bulkCreate(transformedRecs);
        } catch (error) {
          console.error("Error saving recommendations:", error);
        }
        
        setRecommendations(transformedRecs);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setRecommendations([]);
    }
  };
  
  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter(rec => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          rec.title.toLowerCase().includes(query) || 
          rec.genre.toLowerCase().includes(query) ||
          rec.artist?.toLowerCase().includes(query)
        );
      }
      
      // Filter by platform
      if (filterPlatform !== "all") {
        return rec.platforms && rec.platforms.includes(filterPlatform);
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected criterion
      if (sortBy === "bpm") {
        return b.bpm - a.bpm;
      } else if (sortBy === "year") {
        return b.year - a.year;
      }
      // Default: sort by relevance (we'll keep original order)
      return 0;
    });
  
  const handlePlatformClick = (platform, title) => {
    // Create platform-specific deep links
    let url;
    const encodedTitle = encodeURIComponent(title);
    
    switch (platform) {
      case "spotify":
        url = https://open.spotify.com/search/${encodedTitle};
        break;
      case "apple":
        url = https://music.apple.com/search?term=${encodedTitle};
        break;
      case "youtube":
        url = https://www.youtube.com/results?search_query=${encodedTitle};
        break;
      case "amazon":
        url = https://music.amazon.in/search/${encodedTitle};
        break;
      case "gaana":
        url = https://gaana.com/search/${encodedTitle};
        break;
      default:
        url = https://www.google.com/search?q=${encodedTitle}+song;
    }
    
    // Open in a new tab
    window.open(url, "_blank");
  };
  
  const resetSelections = () => {
    setSelectedMood("");
    setSelectedGenres([]);
    setRecommendations([]);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Music className="h-5 w-5 text-pink-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Music Recommendations</h1>
              </div>
              <p className="mt-1 text-gray-500">
                Find the perfect songs and playlists for your current vibe
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              
              <Button
                variant="outline"
                className="gap-2"
                onClick={resetSelections}
              >
                <FilterX className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white p-4 rounded-lg shadow-sm mb-6 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Search Music
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by title, artist, or genre..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-48">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Platform
                  </label>
                  <Select
                    value={filterPlatform}
                    onValueChange={setFilterPlatform}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="apple">Apple Music</SelectItem>
                      <SelectItem value="youtube">YouTube Music</SelectItem>
                      <SelectItem value="amazon">Amazon Music</SelectItem>
                      <SelectItem value="gaana">Gaana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-48">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Sort By
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={setSortBy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="bpm">Energy (BPM)</SelectItem>
                      <SelectItem value="year">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <Tabs defaultValue="mood" value={currentTab} onValueChange={setCurrentTab}>
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mood">
                  By Mood
                </TabsTrigger>
                <TabsTrigger value="genre">
                  By Genre
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="mood" className="mt-0">
                <MoodSelector
                  moods={moods}
                  selectedMood={selectedMood}
                  onMoodSelect={(mood) => {
                    setSelectedMood(mood === selectedMood ? "" : mood);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="genre" className="mt-0">
                <GenreSelector
                  genres={genres}
                  selectedGenres={selectedGenres}
                  onGenreSelect={setSelectedGenres}
                  maxSelections={3}
                />
              </TabsContent>
              
              {(selectedMood || selectedGenres.length > 0) && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t">
                  <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
                    {selectedMood && (
                      <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                        Mood: {selectedMood}
                        <button onClick={() => setSelectedMood("")} className="ml-1 text-gray-500 hover:text-gray-700">
                          &times;
                        </button>
                      </Badge>
                    )}
                    
                    {selectedGenres.map(genre => (
                      <Badge key={genre} variant="secondary" className="flex items-center gap-1 capitalize">
                        {genre}
                        <button 
                          onClick={() => setSelectedGenres(selectedGenres.filter(g => g !== genre))} 
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={getRecommendations}
                    disabled={loading || (!selectedMood && selectedGenres.length === 0)}
                    className="bg-pink-600 hover:bg-pink-700 text-white min-w-[180px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding Music...
                      </>
                    ) : (
                      <>Get Recommendations</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </div>
        
        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Music Recommendations</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Based on your {selectedMood ? "${selectedMood}" mood : ""} 
                  {selectedMood && selectedGenres.length > 0 ? " and " : ""}
                  {selectedGenres.length > 0 ? ${selectedGenres.join(", ")} preferences : ""}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={generateMusicRecommendations}
                disabled={loading}
              >
                <RefreshCcw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((song, index) => (
                  <RecommendationCard
                    key={${song.title}-${index}}
                    title={song.title}
                    subtitle={song.artist}
                    description={${song.year} • ${song.bpm ? song.bpm + ' BPM' : ''}}
                    imageUrl={song.image_url}
                    tags={[song.genre, song.mood]}
                    platforms={song.platforms || ["spotify", "youtube", "apple"]}
                    onPlatformClick={handlePlatformClick}
                    actionLabel="Listen Now"
                    imageHeight="h-52"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Try adjusting your search or filter criteria to find more music.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Initial state - no selections yet */}
        {!loading && recommendations.length === 0 && !selectedMood && selectedGenres.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
              <Play className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">How Are You Feeling Today?</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Select your current mood or favorite genres to get personalized music recommendations.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentTab("mood")}
              >
                Select a Mood
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentTab("genre")}
              >
                Choose Genres
              </Button>
            </div>
          </div>
        )}
        
        {/* Feedback section */}
        {recommendations.length > 0 && (
          <div className="bg-pink-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h3 className="font-semibold text-pink-900 mb-1">How do you like these tracks?</h3>
              <p className="text-pink-700 text-sm">
                Your feedback helps us improve future suggestions
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                className="bg-white gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                I Love These!
              </Button>
              <Button 
                variant="outline" 
                className="bg-white gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Not My Style
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}