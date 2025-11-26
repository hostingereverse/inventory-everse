// Product Scraper from everse.in website
// Fetches product names and details for auto-population

const ProductScraper = {
  BASE_URL: 'https://everse.in',
  CORS_PROXY: 'https://api.allorigins.win/get?url=', // Free CORS proxy
  
  // Search for product on everse.in
  async searchProduct(searchTerm) {
    try {
      // Try multiple search URL patterns (different websites have different structures)
      const searchUrlPatterns = [
        `${this.BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`,
        `${this.BASE_URL}/products?search=${encodeURIComponent(searchTerm)}`,
        `${this.BASE_URL}/shop?q=${encodeURIComponent(searchTerm)}`,
        `${this.BASE_URL}/?s=${encodeURIComponent(searchTerm)}`
      ];
      
      // Try direct fetch first
      for (const searchUrl of searchUrlPatterns) {
        try {
          const response = await fetch(searchUrl, { 
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (response.ok) {
            const html = await response.text();
            const result = this.parseProductResults(html, searchTerm);
            if (result.success && result.products.length > 0) {
              return result;
            }
          }
        } catch (error) {
          console.warn(`Direct fetch failed for ${searchUrl}, trying next...`, error);
        }
      }
      
      // Use CORS proxy as fallback (try first search URL pattern)
      try {
        const searchUrl = searchUrlPatterns[0];
        const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(searchUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        const data = await proxyResponse.json();
        
        if (data && data.contents) {
          const result = this.parseProductResults(data.contents, searchTerm);
          if (result.success && result.products.length > 0) {
            return result;
          }
        }
      } catch (error) {
        console.warn('CORS proxy failed:', error);
      }
      
      // Fallback: Return search term as product (allows manual entry)
      return { 
        success: true, 
        products: [{
          name: searchTerm,
          description: `Product "${searchTerm}" - please verify details manually`,
          price: 0,
          url: `${this.BASE_URL}`,
          relevance: 100
        }],
        searchTerm: searchTerm
      };
    } catch (error) {
      console.error('Product search error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Parse HTML to extract product information
  parseProductResults(html, searchTerm) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try different selectors (adjust based on everse.in website structure)
      const productSelectors = [
        '.product-item',
        '.product-card',
        '.product',
        '[class*="product"]',
        '.item',
        '.product-list-item'
      ];
      
      let products = [];
      
      for (const selector of productSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          products = Array.from(elements).slice(0, 10).map(el => {
            // Extract product name
            const nameEl = el.querySelector('.product-name, .name, h2, h3, [class*="name"], .title, [class*="title"]');
            const name = nameEl ? nameEl.textContent.trim() : '';
            
            // Extract price
            const priceEl = el.querySelector('.price, .product-price, [class*="price"]');
            const priceText = priceEl ? priceEl.textContent.trim() : '';
            const price = this.extractPrice(priceText);
            
            // Extract description
            const descEl = el.querySelector('.description, .product-description, [class*="description"]');
            const description = descEl ? descEl.textContent.trim() : '';
            
            // Extract product link/URL
            const linkEl = el.querySelector('a[href*="product"], a[href*="/p/"]');
            const productUrl = linkEl ? linkEl.href : '';
            
            // Extract image
            const imgEl = el.querySelector('img');
            const imageUrl = imgEl ? imgEl.src : '';
            
            return {
              name: name || searchTerm,
              description: description,
              price: price,
              url: productUrl,
              imageUrl: imageUrl,
              relevance: this.calculateRelevance(name, searchTerm)
            };
          }).filter(p => p.name);
          
          if (products.length > 0) break;
        }
      }
      
      // If no structured products found, try to extract from page content
      if (products.length === 0) {
        // Look for product listings in common patterns
        const allText = doc.body.textContent || '';
        if (allText.toLowerCase().includes(searchTerm.toLowerCase())) {
          // Found search term on page, extract context
          products = [{
            name: searchTerm,
            description: `Product found on everse.in - manual verification recommended`,
            price: 0,
            url: `${this.BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`,
            relevance: 100
          }];
        }
      }
      
      // Sort by relevance
      products.sort((a, b) => b.relevance - a.relevance);
      
      return {
        success: products.length > 0,
        products: products,
        searchTerm: searchTerm
      };
    } catch (error) {
      console.error('Parse error:', error);
      return { success: false, error: 'Failed to parse product data' };
    }
  },
  
  // Extract price from text
  extractPrice(text) {
    if (!text) return 0;
    
    // Remove currency symbols and extract number
    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  },
  
  // Calculate relevance score for search results
  calculateRelevance(productName, searchTerm) {
    if (!productName || !searchTerm) return 0;
    
    const name = productName.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    // Exact match
    if (name === term) return 100;
    
    // Contains search term
    if (name.includes(term)) return 80;
    
    // Partial match
    const words = term.split(' ');
    const matchedWords = words.filter(w => name.includes(w)).length;
    return (matchedWords / words.length) * 60;
  },
  
  // Get product details from product page
  async getProductDetails(productUrl) {
    try {
      if (!productUrl) return { success: false, error: 'No product URL' };
      
      // Try direct fetch
      let html;
      try {
        const response = await fetch(productUrl);
        html = await response.text();
      } catch (error) {
        // Use CORS proxy
        const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(productUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        const data = await proxyResponse.json();
        html = data.contents;
      }
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract detailed product information
      const productName = doc.querySelector('h1, .product-title, .product-name')?.textContent.trim() || '';
      const description = doc.querySelector('.product-description, .description, [class*="description"]')?.textContent.trim() || '';
      const price = this.extractPrice(doc.querySelector('.price, .product-price')?.textContent || '');
      const sku = doc.querySelector('.sku, [class*="sku"]')?.textContent.trim() || '';
      
      // Extract specifications/attributes
      const specs = {};
      doc.querySelectorAll('.spec, .attribute, [class*="spec"]').forEach(el => {
        const label = el.querySelector('.label, .name')?.textContent.trim();
        const value = el.querySelector('.value')?.textContent.trim();
        if (label && value) {
          specs[label] = value;
        }
      });
      
      return {
        success: true,
        product: {
          name: productName,
          description: description,
          price: price,
          sku: sku,
          specs: specs,
          url: productUrl
        }
      };
    } catch (error) {
      console.error('Get product details error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Auto-fill product form from scraper results
  autoFillProductForm(product) {
    if (!product) return;
    
    // Fill product name if field exists
    const nameField = document.getElementById('productName') || document.getElementById('serialProduct');
    if (nameField) {
      nameField.value = product.name || '';
    }
    
    // Fill description if field exists
    const descField = document.getElementById('productDescription');
    if (descField) {
      descField.value = product.description || '';
    }
    
    // Fill price/cost if field exists
    const priceField = document.getElementById('productCost') || document.getElementById('unitCost');
    if (priceField && product.price > 0) {
      // Estimate cost as 70% of sale price
      priceField.value = Math.round(product.price * 0.7);
    }
  }
};

// Export for global use
window.ProductScraper = ProductScraper;

