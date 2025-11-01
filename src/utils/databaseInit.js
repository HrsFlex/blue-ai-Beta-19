// Database initialization utility
import { getDatabase } from '../database/Database';

/**
 * Initialize the SQLite database with proper error handling
 */
export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing SQLite database...');

    const db = getDatabase();

    // Test database connection
    const stats = db.getDatabaseStats();
    console.log('✅ Database initialized successfully');
    console.log('📊 Database stats:', stats);

    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);

    // Provide more helpful error messages
    if (error.message.includes('ENOENT')) {
      console.error('💡 This might be a permissions issue. Try running the application from a directory where you have write permissions.');
    } else if (error.message.includes('EACCES')) {
      console.error('💡 Permission denied. Please check if you have write access to the application directory.');
    } else if (error.message.includes('SQLITE_CANTOPEN')) {
      console.error('💡 Cannot open database file. The file might be locked or corrupted.');
    }

    throw error;
  }
}

/**
 * Create data directory if it doesn't exist
 */
export function ensureDataDirectory() {
  const fs = require('fs');
  const path = require('path');

  const dataDir = path.join(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory:', dataDir);
    } catch (error) {
      console.error('❌ Failed to create data directory:', error);
      throw error;
    }
  }

  return dataDir;
}

/**
 * Check database health and perform basic maintenance
 */
export async function performDatabaseHealthCheck() {
  try {
    const db = getDatabase();

    // Check database connection
    const stats = db.getDatabaseStats();

    // Perform basic cleanup if needed
    const oldSessions = db.cleanupOldSessions(7); // Clean sessions older than 7 days

    console.log('🏥 Database health check completed');
    console.log('📊 Current stats:', stats);
    console.log('🧹 Cleaned up old sessions:', oldSessions.changes);

    return {
      healthy: true,
      stats,
      cleanupPerformed: oldSessions.changes > 0
    };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Backup database to specified location
 */
export async function backupDatabase(backupPath) {
  try {
    const db = getDatabase();

    console.log('💾 Creating database backup...');
    await db.backup(backupPath);

    console.log('✅ Database backup created:', backupPath);
    return true;
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

/**
 * Get database file information
 */
export function getDatabaseInfo() {
  const fs = require('fs');
  const path = require('path');

  const dbPath = path.join(process.cwd(), 'data', 'sakhi.db');

  try {
    const stats = fs.statSync(dbPath);

    return {
      path: dbPath,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true
    };
  } catch (error) {
    return {
      path: dbPath,
      exists: false,
      error: error.message
    };
  }
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Database migration runner
 */
export async function runMigrations() {
  try {
    const db = getDatabase();

    // Check current database version
    const currentVersion = db.getSystemSetting('database_version');
    const targetVersion = '1.0.0';

    if (!currentVersion || currentVersion.value !== targetVersion) {
      console.log('🔄 Running database migrations...');

      // Run migrations here if needed
      // For now, we'll just update the version
      db.setSystemSetting('database_version', targetVersion, 'Database schema version');

      console.log('✅ Database migrations completed');
    } else {
      console.log('✅ Database is up to date');
    }

    return true;
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
}

/**
 * Initialize database when called from browser environment
 */
export async function initBrowserDatabase() {
  try {
    // In browser environment, SQLite cannot run directly
    // We use the backend API for database operations

    console.log('🌐 Browser database initialized (using backend API)...');

    // Test connection to backend
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => {
      // Backend might not be running, that's okay for initialization
      console.log('⚠️ Backend not available, will use fallback mode');
    });

    return true;
  } catch (error) {
    console.error('❌ Browser database initialization failed:', error);
    // Don't throw error to allow app to start even if backend is not available
    return true;
  }
}