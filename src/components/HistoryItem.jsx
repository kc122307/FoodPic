import { motion } from "framer-motion";
import { format } from "date-fns";
import { X, Clock } from "lucide-react";

const HistoryItem = ({ item, onClick, onDelete }) => {
  return (
    <motion.div
      className="flex items-center p-4 bg-transparent hover:bg-gray-50 transition-all cursor-pointer relative group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div 
        className="h-16 w-16 rounded-xl overflow-hidden mr-4 bg-gray-100 flex-shrink-0 border border-gray-200"
        onClick={() => onClick(item)}
      >
        <img 
          src={item.uploadedImage || item.image} 
          alt={item.name} 
          className="h-full w-full object-cover"
        />
      </div>
      
      <div 
        className="flex-1 min-w-0"
        onClick={() => onClick(item)}
      >
        <h3 className="text-base font-semibold text-gray-900 truncate">{item.name}</h3>
        {item.portionSize && (
          <span className="text-xs text-emerald-600 font-medium">{item.portionSize}</span>
        )}
        <div className="flex gap-3 mt-1 text-xs text-gray-700">
          <span className="text-emerald-600 font-medium">{item.calories} cal</span>
          <span className="text-gray-600">•</span>
          <span>{item.protein}g protein</span>
          <span className="text-gray-600">•</span>
          <span>{item.carbs}g carbs</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-700 mt-1">
          <Clock className="w-3 h-3" />
          {format(new Date(item.timestamp), "MMM d, yyyy 'at' h:mm a")}
        </div>
      </div>
      
      <div className="flex flex-col items-end justify-between h-full ml-4">
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {onDelete && (
        <button 
          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-50 border border-transparent hover:border-red-200"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
        >
          <X className="h-4 w-4 text-red-500" />
        </button>
      )}
    </motion.div>
  );
};

export default HistoryItem;
