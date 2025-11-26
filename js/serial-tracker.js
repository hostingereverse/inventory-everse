// Serial Number Tracking System with Barcode Scanner Support
const SerialTracker = {
  // Serial number to product mapping
  // Format: { serialNumber: { productID, productName, warehouse, dateAdded, status } }
  
  // Initialize serial number mapping
  init() {
    // Load from localStorage or initialize
    if (!localStorage.getItem('serial_mappings')) {
      localStorage.setItem('serial_mappings', JSON.stringify({}));
    }
  },
  
  // Map serial number to product (first time entry) - Uses Google Sheets via DataPersistence
  async mapSerialNumber(serialNumber, productID, productName, warehouse) {
    // Try to use Google Sheets persistence first
    if (typeof DataPersistence !== 'undefined' && DataPersistence.saveSerialNumber) {
      const mapping = {
        productID: productID,
        productName: productName,
        warehouse: warehouse,
        dateAdded: new Date().toISOString(),
        status: 'active',
        referenceNumber: null,
        originCombo: null
      };
      
      const result = await DataPersistence.saveSerialNumber(serialNumber, mapping);
      if (result.success) {
        return { success: true, mapping: mapping };
      }
    }
    
    // Fallback to localStorage
    const mappings = this.getAllMappings();
    
    if (mappings[serialNumber]) {
      return { success: false, error: 'Serial number already mapped' };
    }
    
    mappings[serialNumber] = {
      productID: productID,
      productName: productName,
      warehouse: warehouse,
      dateAdded: new Date().toISOString(),
      status: 'active',
      referenceNumber: null,
      originCombo: null
    };
    
    localStorage.setItem('serial_mappings', JSON.stringify(mappings));
    return { success: true, mapping: mappings[serialNumber] };
  },
  
  // Get product by serial number (synchronous - uses cache)
  getProductBySerial(serialNumber) {
    const mappings = this.getAllMappingsSync();
    return mappings[serialNumber] || null;
  },
  
  // Get all serial mappings - Uses Google Sheets via DataPersistence
  async getAllMappings() {
    // Try to load from Google Sheets first
    if (typeof DataPersistence !== 'undefined' && DataPersistence.loadSerialNumbers) {
      try {
        return await DataPersistence.loadSerialNumbers();
      } catch (error) {
        console.warn('Failed to load serial numbers from Google Sheets, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('serial_mappings') || '{}');
  },
  
  // Get all serial mappings (synchronous - uses cache or localStorage)
  getAllMappingsSync() {
    // Try cache first
    if (typeof DataPersistence !== 'undefined' && DataPersistence.getCached) {
      const cached = DataPersistence.getCached('serialNumbers');
      if (cached) return cached;
    }
    
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('serial_mappings') || '{}');
  },
  
  // Get serial numbers for a product (synchronous - uses cache)
  getSerialsForProduct(productID, warehouse = null) {
    const mappings = this.getAllMappingsSync();
    const serials = [];
    
    Object.keys(mappings).forEach(serial => {
      const mapping = mappings[serial];
      if (mapping.productID === productID && mapping.status === 'active') {
        if (!warehouse || mapping.warehouse === warehouse) {
          serials.push(serial);
        }
      }
    });
    
    return serials;
  },
  
  // Update serial number status (when sold/used)
  updateSerialStatus(serialNumber, status, orderID = null) {
    const mappings = this.getAllMappings();
    
    if (!mappings[serialNumber]) {
      return { success: false, error: 'Serial number not found' };
    }
    
    mappings[serialNumber].status = status;
    mappings[serialNumber].lastUsed = new Date().toISOString();
    if (orderID) {
      mappings[serialNumber].orderID = orderID;
    }
    
    localStorage.setItem('serial_mappings', JSON.stringify(mappings));
    return { success: true };
  },
  
  // Break down combo product into individual products
  breakdownCombo(comboProductID, comboSerialNumber, individualProducts) {
    // individualProducts: [{ productID, productName, quantity, serialNumbers }]
    const mappings = this.getAllMappings();
    const referenceNumber = `COMBO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Mark combo serial as broken down
    if (mappings[comboSerialNumber]) {
      mappings[comboSerialNumber].status = 'broken_down';
      mappings[comboSerialNumber].referenceNumber = referenceNumber;
      mappings[comboSerialNumber].brokenDownAt = new Date().toISOString();
    }
    
    // Map individual product serial numbers
    individualProducts.forEach(item => {
      item.serialNumbers.forEach(serial => {
        if (!mappings[serial]) {
          mappings[serial] = {
            productID: item.productID,
            productName: item.productName,
            warehouse: mappings[comboSerialNumber]?.warehouse || 'Unknown',
            dateAdded: new Date().toISOString(),
            status: 'active',
            referenceNumber: referenceNumber,
            originCombo: comboProductID,
            originComboSerial: comboSerialNumber
          };
        }
      });
    });
    
    localStorage.setItem('serial_mappings', JSON.stringify(mappings));
    
    // Save breakdown record
    this.saveBreakdownRecord(referenceNumber, comboProductID, comboSerialNumber, individualProducts);
    
    return { success: true, referenceNumber };
  },
  
  // Save breakdown record for tracking
  saveBreakdownRecord(referenceNumber, comboProductID, comboSerialNumber, individualProducts) {
    const records = JSON.parse(localStorage.getItem('combo_breakdowns') || '[]');
    
    records.push({
      referenceNumber,
      comboProductID,
      comboSerialNumber,
      individualProducts,
      breakdownDate: new Date().toISOString()
    });
    
    localStorage.setItem('combo_breakdowns', JSON.stringify(records));
  },
  
  // Get breakdown records by reference number
  getBreakdownByReference(referenceNumber) {
    const records = JSON.parse(localStorage.getItem('combo_breakdowns') || '[]');
    return records.find(r => r.referenceNumber === referenceNumber);
  },
  
  // Get all breakdown records for a combo product
  getBreakdownsByCombo(comboProductID) {
    const records = JSON.parse(localStorage.getItem('combo_breakdowns') || '[]');
    return records.filter(r => r.comboProductID === comboProductID);
  },
  
  // Get combo origin for a serial number
  getComboOrigin(serialNumber) {
    const mapping = this.getProductBySerial(serialNumber);
    if (mapping && mapping.originCombo) {
      return {
        comboProductID: mapping.originCombo,
        comboSerial: mapping.originComboSerial,
        referenceNumber: mapping.referenceNumber
      };
    }
    return null;
  },
  
  // Validate serial number format (barcode scanner friendly)
  validateSerialNumber(serial) {
    if (!serial || serial.trim().length === 0) {
      return { valid: false, error: 'Serial number cannot be empty' };
    }
    return { valid: true };
  },
  
  // Batch map serial numbers (for bulk entry)
  batchMapSerials(serials, productID, productName, warehouse) {
    const results = [];
    const errors = [];
    
    serials.forEach(serial => {
      const result = this.mapSerialNumber(serial.trim(), productID, productName, warehouse);
      if (result.success) {
        results.push(serial);
      } else {
        errors.push({ serial, error: result.error });
      }
    });
    
    return { success: results.length > 0, mapped: results, errors };
  }
};

// Initialize on load
SerialTracker.init();

// Export for global use
window.SerialTracker = SerialTracker;

