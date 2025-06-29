import React from "react";
import { motion } from "framer-motion";

const MoodSelector = ({ moods, selectedMood, onMoodSelect }) => {
  const moodIcons = {
    happy: "😊",
    sad: "😢",
    relaxed: "😌",
    energetic: "⚡",
    excited: "🤩",
    thoughtful: "🤔",
    romantic: "❤",
    nostalgic: "🕰",
    focused: "🧠",
    stressed: "😰",
    celebration: "🎉"
  };

  const moodColors = {
    happy: "bg-yellow-100 border-yellow-300 text-yellow-700",
    sad: "bg-blue-100 border-blue-300 text-blue-700",
    relaxed: "bg-green-100 border-green-300 text-green-700",
    energetic: "bg-red-100 border-red-300 text-red-700",
    excited: "bg-purple-100 border-purple-300 text-purple-700",
    thoughtful: "bg-indigo-100 border-indigo-300 text-indigo-700",
    romantic: "bg-pink-100 border-pink-300 text-pink-700",
    nostalgic: "bg-amber-100 border-amber-300 text-amber-700",
    focused: "bg-cyan-100 border-cyan-300 text-cyan-700",
    stressed: "bg-orange-100 border-orange-300 text-orange-700",
    celebration: "bg-emerald-100 border-emerald-300 text-emerald-700"
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-4 text-gray-700">How are you feeling today?</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {moods.map((mood) => (
          <motion.button
            key={mood}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMoodSelect(mood)}
            className={`${
              selectedMood === mood 
                ? border-2 shadow-lg ${moodColors[mood]} 
                : "border border-gray-200 bg-white hover:bg-gray-50"
            } rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200`}
          >
            <span className="text-3xl mb-2">{moodIcons[mood] || "🙂"}</span>
            <span className="text-sm font-medium capitalize">
              {mood.replace("_", " ")}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;