// Order Tracking System - Delhivery API and Courier Services
const TRACKING_CONFIG = {
  DELHIVERY_API_KEY: 'd4f8241481282f3a2b05cf2afd66fd73d049592e',
  DELHIVERY_API_URL: 'https://track.delhivery.com/api/v1/packages/json/',
  
  COURIER_SERVICES: [
    {
      id: 'delhivery',
      name: 'Delhivery',
      type: 'api',
      apiKey: 'd4f8241481282f3a2b05cf2afd66fd73d049592e',
      apiUrl: 'https://track.delhivery.com/api/v1/packages/json/',
      trackingUrl: 'https://www.delhivery.com/track/package/'
    },
    {
      id: 'shreetirupati',
      name: 'Shree Tirupati Courier',
      type: 'crawl',
      crawlUrl: 'http://www.shreetirupaticourier.net/index.aspx',
      trackingUrl: 'http://www.shreetirupaticourier.net/index.aspx'
    }
  ],
  
  CRAWL_INTERVAL: 5 * 60 * 60 * 1000, // 5 hours in milliseconds
  MAX_RETRIES: 10
};

// Load courier services from localStorage
function loadCourierServices() {
  const stored = localStorage.getItem('courier_services');
  if (stored) {
    return JSON.parse(stored);
  }
  return TRACKING_CONFIG.COURIER_SERVICES;
}

// Save courier services
function saveCourierServices(services) {
  localStorage.setItem('courier_services', JSON.stringify(services));
}

// Get courier service by ID
function getCourierService(courierId) {
  const services = loadCourierServices();
  return services.find(s => s.id === courierId);
}

// Track order via Delhivery API
async function trackDelhivery(trackingNumber) {
  try {
    const apiKey = TRACKING_CONFIG.DELHIVERY_API_KEY;
    const url = `${TRACKING_CONFIG.DELHIVERY_API_URL}?token=${apiKey}&waybill=${trackingNumber}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const packageData = data[0];
      return {
        success: true,
        trackingNumber: trackingNumber,
        status: packageData.Status || 'Unknown',
        currentLocation: packageData.CurrentLocation || '',
        deliveryDate: packageData.DeliveryDate || null,
        timeline: packageData.Timeline || [],
        courier: 'Delhivery'
      };
    }
    
    return { success: false, error: 'Tracking number not found' };
  } catch (error) {
    console.error('Delhivery tracking error:', error);
    return { success: false, error: error.message };
  }
}

// Crawl Shree Tirupati Courier website
async function trackShreeTirupati(trackingNumber) {
  try {
    // Note: Due to CORS, we'll need a proxy or backend service
    // For now, we'll simulate the tracking
    // In production, use a backend service to crawl
    
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`${TRACKING_CONFIG.COURIER_SERVICES[1].trackingUrl}?track=${trackingNumber}`)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tracking data');
    }
    
    const data = await response.json();
    const html = data.contents;
    
    // Parse HTML to extract tracking information
    // This is a simplified parser - adjust based on actual HTML structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract tracking details (adjust selectors based on actual page structure)
    const statusElement = doc.querySelector('.status, .tracking-status, [class*="status"]');
    const locationElement = doc.querySelector('.location, .current-location');
    
    return {
      success: true,
      trackingNumber: trackingNumber,
      status: statusElement ? statusElement.textContent.trim() : 'In Transit',
      currentLocation: locationElement ? locationElement.textContent.trim() : '',
      courier: 'Shree Tirupati Courier',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Shree Tirupati tracking error:', error);
    return { success: false, error: error.message };
  }
}

// Track order by courier type
async function trackOrder(orderId, trackingNumber, courierId = 'delhivery') {
  const courier = getCourierService(courierId);
  
  if (!courier) {
    return { success: false, error: 'Courier service not found' };
  }
  
  let trackingResult;
  
  if (courier.type === 'api') {
    // Use API tracking
    if (courierId === 'delhivery') {
      trackingResult = await trackDelhivery(trackingNumber);
    } else {
      trackingResult = { success: false, error: 'API tracking not implemented for this courier' };
    }
  } else if (courier.type === 'crawl') {
    // Use web crawling
    if (courierId === 'shreetirupati') {
      trackingResult = await trackShreeTirupati(trackingNumber);
    } else {
      trackingResult = { success: false, error: 'Crawling not implemented for this courier' };
    }
  }
  
  // Save tracking result
  if (trackingResult.success) {
    saveTrackingInfo(orderId, trackingNumber, courierId, trackingResult);
  }
  
  return trackingResult;
}

// Save tracking information - Uses Google Sheets via DataPersistence
async function saveTrackingInfo(orderId, trackingNumber, courierId, trackingData) {
  const tracking = {
    orderId: orderId,
    trackingNumber: trackingNumber,
    courier: courierId,
    status: trackingData.status,
    currentLocation: trackingData.currentLocation || '',
    deliveryDate: trackingData.deliveryDate || null,
    timeline: trackingData.timeline || [],
    lastUpdated: new Date().toISOString(),
    isFulfilled: trackingData.status && (
      trackingData.status.toLowerCase().includes('delivered') ||
      trackingData.status.toLowerCase().includes('completed')
    )
  };
  
  // Try to use Google Sheets persistence first
  if (typeof DataPersistence !== 'undefined' && DataPersistence.saveTracking) {
    try {
      const result = await DataPersistence.saveTracking(orderId, tracking);
      if (result.success) {
        // If fulfilled, update order status
        if (tracking.isFulfilled) {
          updateOrderStatus(orderId, 'FULFILLED');
        }
        return tracking;
      }
    } catch (error) {
      console.warn('Failed to save tracking to Google Sheets, using localStorage:', error);
    }
  }
  
  // Fallback to localStorage
  const allTracking = JSON.parse(localStorage.getItem('order_tracking') || '[]');
  
  // Update or add tracking
  const index = allTracking.findIndex(t => t.orderId === orderId);
  if (index >= 0) {
    allTracking[index] = tracking;
  } else {
    allTracking.push(tracking);
  }
  
  localStorage.setItem('order_tracking', JSON.stringify(allTracking));
  
  // If fulfilled, update order status
  if (tracking.isFulfilled) {
    updateOrderStatus(orderId, 'FULFILLED');
  }
  
  return tracking;
}

// Get tracking info for an order - Uses Google Sheets via DataPersistence
async function getTrackingInfo(orderId) {
  // Try to load from Google Sheets first
  if (typeof DataPersistence !== 'undefined' && DataPersistence.loadTracking) {
    try {
      const trackings = await DataPersistence.loadTracking();
      return trackings[orderId] || null;
    } catch (error) {
      console.warn('Failed to load tracking from Google Sheets, using localStorage:', error);
    }
  }
  
  // Fallback to localStorage
  const allTracking = JSON.parse(localStorage.getItem('order_tracking') || '[]');
  return allTracking.find(t => t.orderId === orderId);
}

// Auto-track all pending orders
async function autoTrackOrders() {
  try {
    const data = await loadAllData();
    const orders = data.orders || [];
    
    // Get all orders with tracking numbers but not fulfilled
    const trackingData = JSON.parse(localStorage.getItem('order_tracking') || '[]');
    
    for (const order of orders) {
      if (order.status === 'SHIPPED' || order.status === 'PROCESSING') {
        const existingTracking = trackingData.find(t => t.orderId === order.orderid);
        
        if (existingTracking && !existingTracking.isFulfilled) {
          // Re-track this order
          await trackOrder(order.orderid, existingTracking.trackingNumber, existingTracking.courierId);
        }
      }
    }
  } catch (error) {
    console.error('Auto-track error:', error);
  }
}

// Start auto-tracking interval
function startAutoTracking() {
  // Track immediately
  autoTrackOrders();
  
  // Then every 5 hours
  setInterval(autoTrackOrders, TRACKING_CONFIG.CRAWL_INTERVAL);
}

// Update order status
async function updateOrderStatus(orderId, status) {
  try {
    // Update in Google Sheets
    const ordersRes = await loadSheet(CONFIG.SHEETS.ORDERS.range, CONFIG.SHEETS.ORDERS.sheetKey);
    const rows = ordersRes.values || [];
    
    const orderIndex = rows.findIndex(r => r[0] === orderId);
    if (orderIndex >= 0) {
      rows[orderIndex][4] = status; // Status is column 4 (E)
      await updateSheet(CONFIG.SHEETS.ORDERS.range, rows, CONFIG.SHEETS.ORDERS.sheetKey);
    }
    
    // Update local data
    if (appData.orders) {
      const order = appData.orders.find(o => o.orderid === orderId);
      if (order) {
        order.status = status;
      }
    }
  } catch (error) {
    console.error('Update order status error:', error);
  }
}

// Add courier service
function addCourierService(service) {
  const services = loadCourierServices();
  
  // Check if service already exists
  const exists = services.find(s => s.id === service.id);
  if (exists) {
    return { success: false, error: 'Courier service already exists' };
  }
  
  services.push(service);
  saveCourierServices(services);
  
  return { success: true };
}

// Update courier service
function updateCourierService(serviceId, updates) {
  const services = loadCourierServices();
  const index = services.findIndex(s => s.id === serviceId);
  
  if (index === -1) {
    return { success: false, error: 'Courier service not found' };
  }
  
  services[index] = { ...services[index], ...updates };
  saveCourierServices(services);
  
  return { success: true };
}

// Delete courier service
function deleteCourierService(serviceId) {
  const services = loadCourierServices();
  const filtered = services.filter(s => s.id !== serviceId);
  
  if (filtered.length === services.length) {
    return { success: false, error: 'Courier service not found' };
  }
  
  saveCourierServices(filtered);
  return { success: true };
}

// Export for use in other scripts
window.Tracking = {
  trackOrder,
  getTrackingInfo,
  trackDelhivery,
  trackShreeTirupati,
  saveTrackingInfo,
  autoTrackOrders,
  startAutoTracking,
  loadCourierServices,
  saveCourierServices,
  getCourierService,
  addCourierService,
  updateCourierService,
  deleteCourierService,
  updateOrderStatus
};

