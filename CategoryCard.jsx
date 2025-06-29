import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card"; {/* Corrected import from /car to /card */}
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

const CategoryCard = ({ title, icon, description, color, page }) => {
  const Icon = icon;
  
  return (
    <Link to={createPageUrl(page)}>
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Card className="h-full border overflow-hidden transition-all duration-300 hover:shadow-lg group">
          <CardContent className="p-6">
            <div className={w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            
            <div className="flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700 transition-colors">
              Explore {title}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: [0, 5, 0] }}
                transition={{ 
                  duration: 1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <ArrowRight className="ml-1 h-4 w-4" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;