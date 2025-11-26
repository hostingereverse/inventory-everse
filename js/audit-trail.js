// Audit Trail System
// Tracks all changes made to the system for compliance and security

const AuditTrail = {
  // Cache for recent audit logs
  cache: {
    logs: [],
    lastLoad: 0,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  },

  // Log an audit event
  async logEvent(event) {
    try {
      const user = GoogleAuth.getCurrentUser();
      if (!user) {
        console.warn('Cannot log audit event: No authenticated user');
        return { success: false, error: 'Not authenticated' };
      }

      const auditEntry = {
        timestamp: new Date().toISOString(),
        user: user.email,
        userName: user.name || user.email,
        action: event.action || 'UNKNOWN',
        entity: event.entity || '',
        entityID: event.entityID || '',
        oldValue: event.oldValue ? JSON.stringify(event.oldValue) : '',
        newValue: event.newValue ? JSON.stringify(event.newValue) : '',
        details: event.details || '',
        ip: event.ip || 'N/A',
        userAgent: navigator.userAgent || 'N/A'
      };

      // Add to cache
      this.cache.logs.unshift(auditEntry);
      if (this.cache.logs.length > 100) {
        this.cache.logs = this.cache.logs.slice(0, 100);
      }

      // Save to Google Sheets
      try {
        const values = [
          auditEntry.timestamp,
          auditEntry.user,
          auditEntry.action,
          auditEntry.entity,
          auditEntry.entityID,
          auditEntry.oldValue,
          auditEntry.newValue,
          auditEntry.details
        ];

        await saveSheet(CONFIG.SHEETS.AUDIT_LOG.range, values, CONFIG.SHEETS.AUDIT_LOG.sheetKey);
      } catch (error) {
        console.error('Failed to save audit log to sheet:', error);
        // Store in localStorage as backup
        const backup = JSON.parse(localStorage.getItem('audit_log_backup') || '[]');
        backup.push(auditEntry);
        if (backup.length > 500) {
          backup.shift(); // Remove oldest
        }
        localStorage.setItem('audit_log_backup', JSON.stringify(backup));
      }

      return { success: true };
    } catch (error) {
      console.error('Audit log error:', error);
      return { success: false, error: error.message };
    }
  },

  // Load audit logs
  async loadLogs(filters = {}) {
    try {
      const now = Date.now();
      
      // Use cache if recent
      if (this.cache.logs.length > 0 && (now - this.cache.lastLoad) < this.cache.cacheDuration) {
        return this.filterLogs(this.cache.logs, filters);
      }

      // Load from Google Sheets
      const response = await loadSheet(CONFIG.SHEETS.AUDIT_LOG.range, CONFIG.SHEETS.AUDIT_LOG.sheetKey);
      const rows = response.values || [];

      if (rows.length > 1) {
        const headers = rows[0];
        const logs = rows.slice(1).map(row => {
          const log = {};
          headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/\s+/g, '');
            log[key] = row[index] || '';
          });
          return log;
        }).reverse(); // Newest first

        // Update cache
        this.cache.logs = logs;
        this.cache.lastLoad = now;

        // Also load from backup if exists
        const backup = JSON.parse(localStorage.getItem('audit_log_backup') || '[]');
        if (backup.length > 0) {
          // Merge and deduplicate
          const merged = [...backup, ...logs];
          const unique = merged.filter((log, index, self) =>
            index === self.findIndex(l => 
              l.timestamp === log.timestamp && 
              l.user === log.user && 
              l.action === log.action
            )
          );
          this.cache.logs = unique.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          ).slice(0, 500); // Keep last 500
        }

        return this.filterLogs(this.cache.logs, filters);
      }

      return [];
    } catch (error) {
      console.error('Load audit logs error:', error);
      // Fallback to localStorage backup
      const backup = JSON.parse(localStorage.getItem('audit_log_backup') || '[]');
      return this.filterLogs(backup, filters);
    }
  },

  // Filter audit logs
  filterLogs(logs, filters) {
    let filtered = [...logs];

    if (filters.user) {
      filtered = filtered.filter(log => 
        log.user?.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => 
        log.action?.toUpperCase() === filters.action.toUpperCase()
      );
    }

    if (filters.entity) {
      filtered = filtered.filter(log => 
        log.entity?.toLowerCase() === filters.entity.toLowerCase()
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.dateTo)
      );
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  },

  // Get user activity
  async getUserActivity(userEmail, days = 7) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    const logs = await this.loadLogs({
      user: userEmail,
      dateFrom: dateFrom.toISOString()
    });

    return logs;
  },

  // Get entity history
  async getEntityHistory(entity, entityID) {
    const logs = await this.loadLogs({
      entity: entity,
      entityID: entityID
    });

    return logs;
  },

  // Clear cache
  clearCache() {
    this.cache.logs = [];
    this.cache.lastLoad = 0;
  }
};

// Export
window.AuditTrail = AuditTrail;

// Helper function for easy logging
async function logAuditEvent(event) {
  return await AuditTrail.logEvent(event);
}

// Export helper
window.logAuditEvent = logAuditEvent;

