import React, { useState } from "react";
import { motion } from "framer-motion";
import { Database, Trash2, Info } from "lucide-react";
import { aiCacheManager } from "../utils/aiCacheManager";

const CacheDebugInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  const refreshCacheStatus = () => {
    const status = aiCacheManager.getCacheStatus();
    setCacheStatus(status);
  };

  const clearCache = () => {
    aiCacheManager.clearAllCache();
    refreshCacheStatus();
  };

  React.useEffect(() => {
    if (isOpen) {
      refreshCacheStatus();
    }
  }, [isOpen]);

  if (import.meta.env.MODE === "production") {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Database className="h-4 w-4" />
          AI Cache Debug
        </button>

        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-gray-200 p-3 bg-gray-50"
          >
            {cacheStatus && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Info className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">Cache Status</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>Cached Items: {cacheStatus.cacheCount}</div>
                  <div>
                    Size: {Math.round(cacheStatus.totalCacheSize / 1024)}KB
                  </div>
                  {cacheStatus.oldestCache && (
                    <div className="col-span-2">
                      Oldest:{" "}
                      {new Date(cacheStatus.oldestCache).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={refreshCacheStatus}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={clearCache}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear Cache
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CacheDebugInfo;
