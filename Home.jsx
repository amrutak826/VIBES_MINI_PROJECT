import React from "react";
import { motion } from "framer-motion";
import { Film, Music, Utensils, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryCard from "../components/home/CategoryCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const categories = [
    {
      title: "Movies",
      icon: Film,
      description: "Discover films tailored to your current mood and taste preferences.",
      color: "bg-indigo-500",
      page: "Movies"
    },
    {
      title: "Music",
      icon: Music,
      description: "Find the perfect playlist based on your emotional state and genre preferences.",
      color: "bg-pink-500",
      page: "Music"
    },
    {
      title: "Food",
      icon: Utensils,
      description: "Get food recommendations that match how you're feeling right now.",
      color: "bg-amber-500",
      page: "Food"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative py-20 px-4 md:py-32 bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:w-1/2 mb-10 md:mb-0 md:pr-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-gray-900">
                Find Your Perfect 
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
                  Daily VIBE
                </span>
              </h1>
            </motion.div>
            
            <p className="text-lg text-gray-600 mb-6">
              Personalized recommendations for movies, music, and food based on your current mood and preferences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-md"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-300"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:w-1/2 relative"
          >
            <div className="relative w-full h-64 md:h-80">
              <div className="absolute top-0 left-0 w-full h-full transform rotate-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl shadow-xl" />
              <div className="absolute -top-2 -left-2 w-full h-full transform -rotate-3 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-2xl shadow-xl" />
              <div className="absolute -bottom-2 -right-2 w-full h-full transform rotate-6 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-2xl shadow-xl" />
              
              <div className="absolute inset-0 bg-white rounded-2xl shadow-lg overflow-hidden flex items-center justify-center z-10">
                <img 
                  src="https://images.unsplash.com/photo-1522869635100-187f6605241d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                  alt="VIBES App"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col items-center justify-end p-6 text-white">
                  <Heart className="h-8 w-8 text-white mb-2" />
                  <h3 className="text-xl font-bold">Find Your Vibe Today</h3>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Discover Recommendations For
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Select a category to get personalized recommendations based on your current mood
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CategoryCard {...category} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              How It Works
            </motion.h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Select a Category",
                description: "Choose between movies, music, or food based on what you're looking for."
              },
              {
                step: "02",
                title: "Share Your Mood",
                description: "Tell us how you're feeling today for better personalized recommendations."
              },
              {
                step: "03",
                title: "Get Recommendations",
                description: "Receive tailored suggestions that match your current mood and preferences."
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <span className="absolute -top-4 -left-4 bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xl font-bold w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold mt-4 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to={createPageUrl("Movies")}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
                Start Exploring <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}