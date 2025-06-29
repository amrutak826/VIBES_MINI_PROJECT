import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const GenreSelector = ({ genres, selectedGenres, onGenreSelect, maxSelections = 3 }) => {
  const genreIcons = {
    // Movie genres
    action: "🎬",
    comedy: "😂",
    drama: "🎭",
    romance: "💞",
    horror: "👻",
    "sci-fi": "🚀",
    thriller: "😱",
    documentary: "📚",
    animation: "🧸",
    fantasy: "🧙‍♂",
    
    // Music genres
    pop: "🎵",
    rock: "🎸",
    "hip-hop": "🎤",
    electronic: "🎧",
    jazz: "🎷",
    classical: "🎻",
    "r&b": "🎙",
    indie: "🪕",
    metal: "🤘",
    folk: "🪗",
    
    // Food cuisines
    italian: "🍕",
    indian: "🍛",
    chinese: "🥢",
    japanese: "🍱",
    mexican: "🌮",
    american: "🍔",
    mediterranean: "🫒",
    thai: "🌶",
    french: "🥐",
    spanish: "🥘"
  };

  const handleGenreToggle = (genre) => {
    if (selectedGenres.includes(genre)) {
      onGenreSelect(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < maxSelections) {
      onGenreSelect([...selectedGenres, genre]);
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Select your preferences</h3>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          {selectedGenres.length}/{maxSelections}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {genres.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <motion.button
              key={genre}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleGenreToggle(genre)}
              disabled={selectedGenres.length >= maxSelections && !isSelected}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl border ${
                isSelected
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : selectedGenres.length >= maxSelections
                  ? "border-gray-200 bg-gray-50 text-gray-400"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              } transition-all duration-200`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <span className="text-2xl mb-2">{genreIcons[genre] || "🏷"}</span>
              <span className="text-sm font-medium capitalize">
                {genre.replace("-", " ")}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreSelector;