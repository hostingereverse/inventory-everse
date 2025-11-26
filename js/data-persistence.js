// Data Persistence Layer
// Migrates data from localStorage to Google Sheets for better reliability

const DataPersistence = {
  // Cache configuration
  cacheConfig: {
    enabled: true,
    duration: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 // Max cached items per data type
  },

  // Cache storage
  cache: {
    orders: { data: null, timestamp: 0 },
    inventory: { data: null, timestamp: 0 },
    movements: { data: null, timestamp: 0 },
    gaps: { data: null, timestamp: 0 },
    serialNumbers: { data: null, timestamp: 0 },
    tracking: { data: null, timestamp: 0 }
  },

  // Migrate serial numbers from localStorage to Google Sheets
  async migrateSerialNumbers() {
    try {
      const localData = localStorage.getItem('serial_mappings');
      if (!localData) return { success: true, migrated: 0 };

      const mappings = JSON.parse(localData);
      const serialNumbers = [];

      for (const [serial, mapping] of Object.entries(mappings)) {
        serialNumbers.push([
          serial,
          mapping.productID || '',
          mapping.productName || '',
          mapping.warehouse || '',
          mapping.status || 'active',
          mapping.dateAdded || new Date().toISOString(),
          mapping.referenceNumber || ''
        ]);
      }

      if (serialNumbers.length > 0) {
        // Clear existing data (optional - comment out if you want to keep)
        // For migration, we append to existing
        for (const serial of serialNumbers) {
          await saveSheet(CONFIG.SHEETS.SERIAL_NUMBERS.range, serial, CONFIG.SHEETS.SERIAL_NUMBERS.sheetKey);
        }

        // Log migration
        await logAuditEvent({
          action: 'MIGRATE',
          entity: 'SerialNumbers',
          details: `Migrated ${serialNumbers.length} serial numbers from localStorage to Google Sheets`
        });

        return { success: true, migrated: serialNumbers.length };
      }

      return { success: true, migrated: 0 };
    } catch (error) {
      console.error('Migrate serial numbers error:', error);
      return { success: false, error: error.message };
    }
  },

  // Migrate tracking data from localStorage to Google Sheets
  async migrateTracking() {
    try {
      const localData = localStorage.getItem('order_tracking');
      if (!localData) return { success: true, migrated: 0 };

      const trackings = JSON.parse(localData);
      const trackingRows = [];

      for (const tracking of trackings) {
        trackingRows.push([
          tracking.orderId || '',
          tracking.trackingNumber || '',
          tracking.courierId || '',
          tracking.status || '',
          tracking.currentLocation || '',
          tracking.lastUpdated || new Date().toISOString(),
          tracking.deliveryDate || '',
          JSON.stringify(tracking.timeline || [])
        ]);
      }

      if (trackingRows.length > 0) {
        for (const row of trackingRows) {
          await saveSheet(CONFIG.SHEETS.TRACKING.range, row, CONFIG.SHEETS.TRACKING.sheetKey);
        }

        await logAuditEvent({
          action: 'MIGRATE',
          entity: 'Tracking',
          details: `Migrated ${trackingRows.length} tracking records from localStorage to Google Sheets`
        });

        return { success: true, migrated: trackingRows.length };
      }

      return { success: true, migrated: 0 };
    } catch (error) {
      console.error('Migrate tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Load serial numbers from Google Sheets
  async loadSerialNumbers(forceRefresh = false) {
    const cacheKey = 'serialNumbers';
    const now = Date.now();

    // Check cache
    if (!forceRefresh && this.cache[cacheKey] && 
        (now - this.cache[cacheKey].timestamp) < this.cacheConfig.duration) {
      return this.cache[cacheKey].data;
    }

    try {
      const response = await loadSheet(CONFIG.SHEETS.SERIAL_NUMBERS.range, CONFIG.SHEETS.SERIAL_NUMBERS.sheetKey);
      const rows = response.values || [];

      let serialNumbers = {};
      if (rows.length > 1) {
        const headers = rows[0];
        rows.slice(1).forEach(row => {
          const serial = row[0];
          if (serial) {
            serialNumbers[serial] = {
              productID: row[1] || '',
              productName: row[2] || '',
              warehouse: row[3] || '',
              status: row[4] || 'active',
              dateAdded: row[5] || new Date().toISOString(),
              referenceNumber: row[6] || ''
            };
          }
        });
      }

      // Update cache
      this.cache[cacheKey] = {
        data: serialNumbers,
        timestamp: now
      };

      return serialNumbers;
    } catch (error) {
      console.error('Load serial numbers error:', error);
      return {};
    }
  },

  // Save serial number to Google Sheets
  async saveSerialNumber(serial, mapping) {
    try {
      const values = [
        serial,
        mapping.productID || '',
        mapping.productName || '',
        mapping.warehouse || '',
        mapping.status || 'active',
        mapping.dateAdded || new Date().toISOString(),
        mapping.referenceNumber || ''
      ];

      await saveSheet(CONFIG.SHEETS.SERIAL_NUMBERS.range, values, CONFIG.SHEETS.SERIAL_NUMBERS.sheetKey);

      // Clear cache
      this.cache.serialNumbers = { data: null, timestamp: 0 };

      // Log audit
      await logAuditEvent({
        action: 'CREATE',
        entity: 'SerialNumber',
        entityID: serial,
        newValue: mapping,
        details: `Serial number ${serial} mapped to ${mapping.productName}`
      });

      return { success: true };
    } catch (error) {
      console.error('Save serial number error:', error);
      return { success: false, error: error.message };
    }
  },

  // Load tracking data from Google Sheets
  async loadTracking(forceRefresh = false) {
    const cacheKey = 'tracking';
    const now = Date.now();

    if (!forceRefresh && this.cache[cacheKey] && 
        (now - this.cache[cacheKey].timestamp) < this.cacheConfig.duration) {
      return this.cache[cacheKey].data;
    }

    try {
      const response = await loadSheet(CONFIG.SHEETS.TRACKING.range, CONFIG.SHEETS.TRACKING.sheetKey);
      const rows = response.values || [];

      let trackings = {};
      if (rows.length > 1) {
        const headers = rows[0];
        rows.slice(1).forEach(row => {
          const orderId = row[0];
          if (orderId) {
            trackings[orderId] = {
              trackingNumber: row[1] || '',
              courier: row[2] || '',
              status: row[3] || '',
              currentLocation: row[4] || '',
              lastUpdated: row[5] || new Date().toISOString(),
              deliveryDate: row[6] || '',
              timeline: row[7] ? JSON.parse(row[7]) : []
            };
          }
        });
      }

      this.cache[cacheKey] = {
        data: trackings,
        timestamp: now
      };

      return trackings;
    } catch (error) {
      console.error('Load tracking error:', error);
      return {};
    }
  },

  // Save tracking to Google Sheets
  async saveTracking(orderId, trackingData) {
    try {
      // Check if tracking exists (update) or new (append)
      const existing = await this.loadTracking();
      const isUpdate = existing[orderId];

      const values = [
        orderId,
        trackingData.trackingNumber || '',
        trackingData.courier || '',
        trackingData.status || '',
        trackingData.currentLocation || '',
        trackingData.lastUpdated || new Date().toISOString(),
        trackingData.deliveryDate || '',
        JSON.stringify(trackingData.timeline || [])
      ];

      if (isUpdate) {
        // Update existing - need to find row and update
        const response = await loadSheet(CONFIG.SHEETS.TRACKING.range, CONFIG.SHEETS.TRACKING.sheetKey);
        const rows = response.values || [];
        const rowIndex = rows.findIndex(row => row[0] === orderId);
        
        if (rowIndex >= 0) {
          rows[rowIndex] = values;
          await updateSheet(CONFIG.SHEETS.TRACKING.range, rows, CONFIG.SHEETS.TRACKING.sheetKey);
        }
      } else {
        await saveSheet(CONFIG.SHEETS.TRACKING.range, values, CONFIG.SHEETS.TRACKING.sheetKey);
      }

      // Clear cache
      this.cache.tracking = { data: null, timestamp: 0 };

      await logAuditEvent({
        action: isUpdate ? 'UPDATE' : 'CREATE',
        entity: 'Tracking',
        entityID: orderId,
        newValue: trackingData,
        details: `Tracking ${isUpdate ? 'updated' : 'added'} for order ${orderId}`
      });

      return { success: true };
    } catch (error) {
      console.error('Save tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear cache for specific data type
  clearCache(dataType) {
    if (this.cache[dataType]) {
      this.cache[dataType] = { data: null, timestamp: 0 };
    }
  },

  // Clear all caches
  clearAllCaches() {
    Object.keys(this.cache).forEach(key => {
      this.cache[key] = { data: null, timestamp: 0 };
    });
  },

  // Get cached data (if available and not expired)
  getCached(dataType) {
    const cached = this.cache[dataType];
    if (!cached || !cached.data) return null;

    const now = Date.now();
    if ((now - cached.timestamp) < this.cacheConfig.duration) {
      return cached.data;
    }

    return null;
  }
};

// Export
window.DataPersistence = DataPersistence;

