// Optimized Data Loader with Caching and Real-time Updates
// Fast loading with intelligent caching strategy

const DataLoader = {
  // Cache configuration
  cache: {
    enabled: true,
    duration: 5 * 60 * 1000, // 5 minutes default
    storage: new Map()
  },

  // Polling configuration
  polling: {
    enabled: true,
    interval: 30 * 1000, // 30 seconds
    active: false,
    intervalId: null
  },

  // Load all data with caching
  async loadAllData(forceRefresh = false) {
    const cacheKey = 'allData';
    const now = Date.now();

    // Check cache
    if (!forceRefresh && this.cache.storage.has(cacheKey)) {
      const cached = this.cache.storage.get(cacheKey);
      if ((now - cached.timestamp) < this.cache.duration) {
        return cached.data;
      }
    }

    try {
      // Load all data in parallel
      const [ordersRes, inventoryRes, movementsRes, gapsRes, serialNumbersRes, trackingRes] = await Promise.all([
        loadSheet(CONFIG.SHEETS.ORDERS.range, CONFIG.SHEETS.ORDERS.sheetKey),
        loadSheet(CONFIG.SHEETS.INVENTORY.range, CONFIG.SHEETS.INVENTORY.sheetKey),
        loadSheet(CONFIG.SHEETS.STOCK_MOVEMENTS.range, CONFIG.SHEETS.STOCK_MOVEMENTS.sheetKey),
        loadSheet(CONFIG.SHEETS.GAPS.range, CONFIG.SHEETS.GAPS.sheetKey),
        DataPersistence.loadSerialNumbers(forceRefresh),
        DataPersistence.loadTracking(forceRefresh)
      ]);

      const data = {
        orders: parseOrders(ordersRes.values || []),
        inventory: parseInventory(inventoryRes.values || []),
        movements: parseMovements(movementsRes.values || []),
        gaps: parseGaps(gapsRes.values || []),
        serialNumbers: serialNumbersRes || {},
        tracking: trackingRes || {},
        lastUpdated: new Date().toISOString()
      };

      // Update cache
      this.cache.storage.set(cacheKey, {
        data: data,
        timestamp: now
      });

      // Limit cache size
      if (this.cache.storage.size > 10) {
        const firstKey = this.cache.storage.keys().next().value;
        this.cache.storage.delete(firstKey);
      }

      return data;
    } catch (error) {
      console.error('Load all data error:', error);
      
      // Return cached data if available (even if expired)
      if (this.cache.storage.has(cacheKey)) {
        const cached = this.cache.storage.get(cacheKey);
        console.warn('Using expired cache due to error');
        return cached.data;
      }

      // Return sample data as last resort
      return getSampleData();
    }
  },

  // Start real-time polling
  startPolling(callback, interval = null) {
    if (this.polling.active) return;

    const pollInterval = interval || this.polling.interval;
    this.polling.active = true;

    this.polling.intervalId = setInterval(async () => {
      try {
        const data = await this.loadAllData(true); // Force refresh
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, pollInterval);

    // Also poll immediately
    this.loadAllData(true).then(data => {
      if (callback && typeof callback === 'function') {
        callback(data);
      }
    });
  },

  // Stop polling
  stopPolling() {
    if (this.polling.intervalId) {
      clearInterval(this.polling.intervalId);
      this.polling.intervalId = null;
    }
    this.polling.active = false;
  },

  // Clear cache
  clearCache() {
    this.cache.storage.clear();
    DataPersistence.clearAllCaches();
  },

  // Invalidate specific cache key
  invalidateCache(key) {
    this.cache.storage.delete(key);
    DataPersistence.clearCache(key);
  }
};

// Export
window.DataLoader = DataLoader;

// Replace loadAllData with cached version
window.loadAllData = async function(forceRefresh = false) {
  return await DataLoader.loadAllData(forceRefresh);
};

