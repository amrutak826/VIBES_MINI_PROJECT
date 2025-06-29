import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "@/entities/User";
import { UserPreference } from "@/entities/UserPreference";
import { FoodRecommendation } from "@/entities/FoodRecommendation";
import { InvokeLLM } from "@/integrations/Core";
import MoodSelector from "../components/ui/mood-selector";
import GenreSelector from "../components/ui/genre-selector";
import RecommendationCard from "../components/ui/recommendation-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Utensils,
  Clock,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  FilterX,
  ThumbsUp,
  ThumbsDown,
  Flame
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FoodPage() {
  const [user, setUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentTab, setCurrentTab] = useState("mood");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState("all");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterSpice, setFilterSpice] = useState("all");
  
  const moods = ["happy", "sad", "energetic", "relaxed", "stressed", "celebration"];
  const cuisines = ["italian", "indian", "chinese", "japanese", "mexican", "american", "mediterranean", "thai", "french", "spanish"];
  const mealTypes = ["all", "breakfast", "lunch", "dinner", "snack", "dessert"];
  
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
          // If user has preferred cuisines, preselect up to 3
          if (preferences[0].favorite_cuisines?.length > 0) {
            setSelectedCuisines(preferences[0].favorite_cuisines.slice(0, 3));
          }
        }
      } catch (error) {
        console.log("User not logged in or error fetching data", error);
      }
    }
    
    fetchUserData();
  }, []);
  
  // Get food recommendations
  const getRecommendations = async () => {
    if (!selectedMood && selectedCuisines.length === 0) {
      // Need at least mood or a cuisine
      return;
    }
    
    setLoading(true);
    
    try {
      // First try to get from our database
      let foodRecs;
      
      if (selectedMood && selectedCuisines.length > 0) {
        // Filter by both mood and cuisine
        foodRecs = await FoodRecommendation.filter({
          mood: selectedMood,
          cuisine: { $in: selectedCuisines },
          ...(selectedMealType !== "all" ? { meal_type: selectedMealType } : {})
        });
      } else if (selectedMood) {
        // Only filter by mood
        foodRecs = await FoodRecommendation.filter({ 
          mood: selectedMood,
          ...(selectedMealType !== "all" ? { meal_type: selectedMealType } : {})
        });
      } else {
        // Only filter by cuisines
        foodRecs = await FoodRecommendation.filter({
          cuisine: { $in: selectedCuisines },
          ...(selectedMealType !== "all" ? { meal_type: selectedMealType } : {})
        });
      }
      
      // If we don't have enough recommendations in our database, generate more
      if (foodRecs.length < 5) {
        await generateFoodRecommendations();
      } else {
        setRecommendations(foodRecs);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      await generateFoodRecommendations();
    }
    
    setLoading(false);
  };
  
  // Generate food recommendations using LLM
  const generateFoodRecommendations = async () => {
    try {
      const prompt = `
        Generate 10 food recommendations for a user who is feeling ${selectedMood || "any mood"} 
        and likes the following cuisines: ${selectedCuisines.join(", ") || "all cuisines"}.
        ${selectedMealType !== "all" ? They are looking for ${selectedMealType} options. : ""}
        
        For each food item, include:
        - Name of the dish
        - Cuisine it belongs to
        - Type of meal (breakfast, lunch, dinner, snack, or dessert)
        - A short description (1-2 sentences)
        - Prep time in minutes
        - Spice level (mild, medium, spicy, or very_spicy)
        - The mood it matches
        - On which food delivery platforms it might be available (swiggy, zomato, uber_eats, doordash, grubhub, zepto, blinkit)
        
        Make sure the recommendations are diverse, actually match the requested mood and cuisines, and are specific dishes (not generic food categories).
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
                  name: { type: "string" },
                  cuisine: { type: "string" },
                  meal_type: { type: "string" },
                  description: { type: "string" },
                  prep_time: { type: "number" },
                  spice_level: { type: "string" },
                  mood: { type: "string" },
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
        const transformedRecs = result.recommendations.map(food => ({
          ...food,
          image_url: https://source.unsplash.com/random/500x500/?food,${food.name.replace(/\s+/g, ',')},${food.cuisine},
        }));
        
        // Save to our database for future use
        try {
          await FoodRecommendation.bulkCreate(transformedRecs);
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
      let matches = true;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matches = matches && (
          rec.name.toLowerCase().includes(query) || 
          rec.cuisine.toLowerCase().includes(query) ||
          rec.description?.toLowerCase().includes(query)
        );
      }
      
      // Filter by platform
      if (filterPlatform !== "all") {
        matches = matches && (rec.platforms && rec.platforms.includes(filterPlatform));
      }
      
      // Filter by spice level
      if (filterSpice !== "all") {
        matches = matches && (rec.spice_level === filterSpice);
      }
      
      return matches;
    })
    .sort((a, b) => {
      // Sort by selected criterion
      if (sortBy === "prep_time") {
        return a.prep_time - b.prep_time; // Faster prep time first
      } else if (sortBy === "spice") {
        const spiceLevels = { mild: 1, medium: 2, spicy: 3, very_spicy: 4 };
        return spiceLevels[b.spice_level] - spiceLevels[a.spice_level];
      }
      // Default: sort by relevance (we'll keep original order)
      return 0;
    });
  
  const handlePlatformClick = (platform, foodName) => {
    // Create platform-specific deep links
    let url;
    const encodedName = encodeURIComponent(foodName);
    
    switch (platform) {
      case "swiggy":
        url = https://www.swiggy.com/search?query=${encodedName};
        break;
      case "zomato":
        url = https://www.zomato.com/search?q=${encodedName};
        break;
      case "uber_eats":
        url = https://www.ubereats.com/search?q=${encodedName};
        break;
      case "doordash":
        url = https://www.doordash.com/search/${encodedName}/;
        break;
      case "grubhub":
        url = https://www.grubhub.com/search?queryText=${encodedName};
        break;
      case "zepto":
        url = https://www.zeptonow.com/search?q=${encodedName};
        break;
      case "blinkit":
        url = https://blinkit.com/search?query=${encodedName};
        break;
      default:
        url = https://www.google.com/search?q=${encodedName}+food+delivery;
    }
    
    // Open in a new tab
    window.open(url, "_blank");
  };
  
  const resetSelections = () => {
    setSelectedMood("");
    setSelectedCuisines([]);
    setSelectedMealType("all");
    setRecommendations([]);
  };
  
  // Function to render spice level with visual indicator
  const renderSpiceLevel = (level) => {
    const levels = {
      mild: { text: "Mild", color: "bg-green-500", number: 1 },
      medium: { text: "Medium", color: "bg-yellow-500", number: 2 },
      spicy: { text: "Spicy", color: "bg-orange-500", number: 3 },
      very_spicy: { text: "Very Spicy", color: "bg-red-500", number: 4 }
    };
    
    const info = levels[level] || levels.mild;
    
    return (
      <div className="flex items-center gap-1">
        {Array(info.number).fill(0).map((_, i) => (
          <div key={i} className={h-2 w-2 rounded-full ${info.color}} />
        ))}
        <span className="ml-1 text-xs">{info.text}</span>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Utensils className="h-5 w-5 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Food Recommendations</h1>
              </div>
              <p className="mt-1 text-gray-500">
                Discover food and dishes that match your current mood and taste
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Search Dishes
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, cuisine, or description..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Meal Type
                  </label>
                  <Select
                    value={selectedMealType}
                    onValueChange={setSelectedMealType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Meal Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type === "all" ? "All Meals" : type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Spice Level
                  </label>
                  <Select
                    value={filterSpice}
                    onValueChange={setFilterSpice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Spice Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Spice Level</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="spicy">Spicy</SelectItem>
                      <SelectItem value="very_spicy">Very Spicy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Delivery Platform
                  </label>
                  <Select
                    value={filterPlatform}
                    onValueChange={setFilterPlatform}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Delivery Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="swiggy">Swiggy</SelectItem>
                      <SelectItem value="zomato">Zomato</SelectItem>
                      <SelectItem value="uber_eats">Uber Eats</SelectItem>
                      <SelectItem value="zepto">Zepto</SelectItem>
                      <SelectItem value="blinkit">Blinkit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
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
                      <SelectItem value="prep_time">Prep Time</SelectItem>
                      <SelectItem value="spice">Spice Level</SelectItem>
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
                <TabsTrigger value="cuisine">
                  By Cuisine
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
              
              <TabsContent value="cuisine" className="mt-0">
                <GenreSelector
                  genres={cuisines}
                  selectedGenres={selectedCuisines}
                  onGenreSelect={setSelectedCuisines}
                  maxSelections={3}
                />
              </TabsContent>
              
              {(selectedMood || selectedCuisines.length > 0) && (
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
                    
                    {selectedMealType !== "all" && (
                      <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                        {selectedMealType}
                        <button onClick={() => setSelectedMealType("all")} className="ml-1 text-gray-500 hover:text-gray-700">
                          &times;
                        </button>
                      </Badge>
                    )}
                    
                    {selectedCuisines.map(cuisine => (
                      <Badge key={cuisine} variant="secondary" className="flex items-center gap-1 capitalize">
                        {cuisine}
                        <button 
                          onClick={() => setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine))} 
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={getRecommendations}
                    disabled={loading || (!selectedMood && selectedCuisines.length === 0)}
                    className="bg-amber-600 hover:bg-amber-700 text-white min-w-[180px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding Food...
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
                <h2 className="text-xl font-bold text-gray-900">Your Food Recommendations</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Based on your {selectedMood ? "${selectedMood}" mood : ""} 
                  {selectedMood && selectedCuisines.length > 0 ? " and " : ""}
                  {selectedCuisines.length > 0 ? ${selectedCuisines.join(", ")} preferences : ""}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={generateFoodRecommendations}
                disabled={loading}
              >
                <RefreshCcw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((food, index) => (
                  <RecommendationCard
                    key={${food.name}-${index}}
                    title={food.name}
                    subtitle={
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{food.cuisine}</span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{food.prep_time} min</span>
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <p className="mb-2">{food.description || "No description available."}</p>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {renderSpiceLevel(food.spice_level)}
                        </div>
                      </div>
                    }
                    imageUrl={food.image_url}
                    tags={[food.cuisine, food.meal_type, food.mood]}
                    platforms={food.platforms || ["swiggy", "zomato"]}
                    onPlatformClick={handlePlatformClick}
                    actionLabel="Order Now"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Try adjusting your search or filter criteria to find more food options.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Initial state - no selections yet */}
        {!loading && recommendations.length === 0 && !selectedMood && selectedCuisines.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Utensils className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">What Are You Craving?</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Select your current mood or preferred cuisines to get personalized food recommendations.
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
                onClick={() => setCurrentTab("cuisine")}
              >
                Choose Cuisines
              </Button>
            </div>
          </div>
        )}
        
        {/* Feedback section */}
        {recommendations.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">How do you like these suggestions?</h3>
              <p className="text-amber-700 text-sm">
                Your feedback helps us improve future recommendations
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                className="bg-white gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Looks Delicious!
              </Button>
              <Button 
                variant="outline" 
                className="bg-white gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Not For Me
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}