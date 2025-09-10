/**
 * Claude Flow Memory System
 * Advanced memory management with namespaces, persistence, and search
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class MemorySystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            backend: config.backend || 'filesystem',
            autoSave: config.autoSave !== false,
            autoSaveInterval: config.autoSaveInterval || 30000,
            maxMemorySize: config.maxMemorySize || 100 * 1024 * 1024, // 100MB
            compressionEnabled: config.compressionEnabled !== false,
            debug: config.debug || false,
            basePath: config.basePath || path.join(process.cwd(), '.claude-flow', 'memory'),
            ...config
        };
        
        // In-memory storage for active data
        this.memory = new Map();
        this.namespaces = new Map();
        this.metadata = new Map();
        
        // Performance tracking
        this.stats = {
            operations: 0,
            hits: 0,
            misses: 0,
            stores: 0,
            retrievals: 0,
            searches: 0
        };
        
        this.initialized = false;
        this.autoSaveTimer = null;
    }
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Ensure memory directory exists
            await fs.ensureDir(this.config.basePath);
            
            // Load existing memory data
            await this.loadFromDisk();
            
            // Start auto-save if enabled
            if (this.config.autoSave) {
                this.startAutoSave();
            }
            
            this.initialized = true;
            this.log('Memory system initialized');
            this.emit('initialized');
        } catch (error) {
            this.logError('Failed to initialize memory system', error);
            throw error;
        }
    }
    
    async store(key, data, namespace = 'default') {
        this.stats.operations++;
        this.stats.stores++;
        
        try {
            const fullKey = this.buildKey(key, namespace);
            const entry = {
                id: uuidv4(),
                key: fullKey,
                namespace,
                data: _.cloneDeep(data),
                timestamp: new Date().toISOString(),
                size: this.calculateSize(data),
                version: 1
            };
            
            // Store in memory
            this.memory.set(fullKey, entry);
            
            // Update namespace tracking
            if (!this.namespaces.has(namespace)) {
                this.namespaces.set(namespace, new Set());
            }
            this.namespaces.get(namespace).add(key);
            
            // Store metadata
            this.metadata.set(fullKey, {
                created: entry.timestamp,
                updated: entry.timestamp,
                accessCount: 0,
                size: entry.size
            });
            
            // Persist to disk if auto-save is disabled
            if (!this.config.autoSave) {
                await this.persistToDisk(fullKey, entry);
            }
            
            this.log(`Stored memory: ${fullKey}`, { size: entry.size });
            this.emit('memoryStored', fullKey, data);
            
            return entry.id;
        } catch (error) {
            this.logError(`Failed to store memory: ${key}`, error);
            throw error;
        }
    }
    
    async retrieve(key, namespace = 'default') {
        this.stats.operations++;
        this.stats.retrievals++;
        
        try {
            const fullKey = this.buildKey(key, namespace);
            
            // Try memory first
            let entry = this.memory.get(fullKey);
            
            if (entry) {
                this.stats.hits++;
                this.updateAccessMetadata(fullKey);
                this.log(`Retrieved from memory: ${fullKey}`);
                this.emit('memoryRetrieved', fullKey, entry.data);
                return entry.data;
            }
            
            // Try disk
            entry = await this.loadFromDisk(fullKey);
            if (entry) {
                this.stats.hits++;
                // Cache in memory
                this.memory.set(fullKey, entry);
                this.updateAccessMetadata(fullKey);
                this.log(`Retrieved from disk: ${fullKey}`);
                this.emit('memoryRetrieved', fullKey, entry.data);
                return entry.data;
            }
            
            this.stats.misses++;
            this.log(`Memory not found: ${fullKey}`);
            return null;
        } catch (error) {
            this.logError(`Failed to retrieve memory: ${key}`, error);
            throw error;
        }
    }
    
    async search(query, options = {}) {
        this.stats.operations++;
        this.stats.searches++;
        
        try {
            const {
                namespace = null,
                limit = 50,
                sortBy = 'timestamp',
                sortOrder = 'desc',
                includeData = false
            } = options;
            
            let results = [];
            
            // Search in memory
            for (const [fullKey, entry] of this.memory.entries()) {
                if (namespace && entry.namespace !== namespace) continue;
                
                if (this.matchesQuery(entry, query)) {
                    results.push({
                        key: entry.key,
                        namespace: entry.namespace,
                        timestamp: entry.timestamp,
                        size: entry.size,
                        data: includeData ? entry.data : undefined
                    });
                }
            }
            
            // Sort results
            results = _.orderBy(results, [sortBy], [sortOrder]);
            
            // Apply limit
            if (limit > 0) {
                results = results.slice(0, limit);
            }
            
            this.log(`Search completed: ${query}`, { 
                results: results.length,
                namespace 
            });
            
            return results;
        } catch (error) {
            this.logError(`Search failed: ${query}`, error);
            throw error;
        }
    }
    
    async delete(key, namespace = 'default') {
        try {
            const fullKey = this.buildKey(key, namespace);
            
            // Remove from memory
            const deleted = this.memory.delete(fullKey);
            
            // Remove from namespace tracking
            if (this.namespaces.has(namespace)) {
                this.namespaces.get(namespace).delete(key);
            }
            
            // Remove metadata
            this.metadata.delete(fullKey);
            
            // Remove from disk
            await this.deleteFromDisk(fullKey);
            
            if (deleted) {
                this.log(`Deleted memory: ${fullKey}`);
                this.emit('memoryDeleted', fullKey);
            }
            
            return deleted;
        } catch (error) {
            this.logError(`Failed to delete memory: ${key}`, error);
            throw error;
        }
    }
    
    async clear(namespace = null) {
        try {
            if (namespace) {
                // Clear specific namespace
                const keys = this.namespaces.get(namespace) || new Set();
                for (const key of keys) {
                    await this.delete(key, namespace);
                }
                this.namespaces.delete(namespace);
            } else {
                // Clear all memory
                this.memory.clear();
                this.namespaces.clear();
                this.metadata.clear();
                
                // Clear disk storage
                await fs.emptyDir(this.config.basePath);
            }
            
            this.log(`Cleared memory${namespace ? ` for namespace: ${namespace}` : ''}`);
            this.emit('memoryCleared', namespace);
        } catch (error) {
            this.logError('Failed to clear memory', error);
            throw error;
        }
    }
    
    getNamespaces() {
        return Array.from(this.namespaces.keys());
    }
    
    getKeys(namespace = 'default') {
        return Array.from(this.namespaces.get(namespace) || new Set());
    }
    
    getStats() {
        return {
            ...this.stats,
            memorySize: this.memory.size,
            namespaces: this.namespaces.size,
            totalSize: this.calculateTotalSize(),
            hitRate: this.stats.operations > 0 ? 
                (this.stats.hits / this.stats.operations * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    buildKey(key, namespace) {
        return `${namespace}:${key}`;
    }
    
    matchesQuery(entry, query) {
        if (typeof query === 'string') {
            const searchText = query.toLowerCase();
            return (
                entry.key.toLowerCase().includes(searchText) ||
                entry.namespace.toLowerCase().includes(searchText) ||
                JSON.stringify(entry.data).toLowerCase().includes(searchText)
            );
        }
        
        if (typeof query === 'object') {
            return _.isMatch(entry.data, query);
        }
        
        return false;
    }
    
    updateAccessMetadata(fullKey) {
        const meta = this.metadata.get(fullKey);
        if (meta) {
            meta.accessCount++;
            meta.lastAccessed = new Date().toISOString();
        }
    }
    
    calculateSize(data) {
        return JSON.stringify(data).length;
    }
    
    calculateTotalSize() {
        let total = 0;
        for (const entry of this.memory.values()) {
            total += entry.size;
        }
        return total;
    }
    
    async loadFromDisk(specificKey = null) {
        try {
            if (specificKey) {
                const filePath = path.join(this.config.basePath, `${specificKey}.json`);
                if (await fs.pathExists(filePath)) {
                    return await fs.readJson(filePath);
                }
                return null;
            }
            
            // Load all memory files
            const files = await fs.readdir(this.config.basePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.config.basePath, file);
                    const entry = await fs.readJson(filePath);
                    this.memory.set(entry.key, entry);
                    
                    // Rebuild namespace tracking
                    if (!this.namespaces.has(entry.namespace)) {
                        this.namespaces.set(entry.namespace, new Set());
                    }
                    this.namespaces.get(entry.namespace).add(entry.key.split(':')[1]);
                }
            }
            
            this.log(`Loaded ${this.memory.size} entries from disk`);
        } catch (error) {
            this.logError('Failed to load from disk', error);
        }
    }
    
    async persistToDisk(fullKey, entry) {
        try {
            const filePath = path.join(this.config.basePath, `${fullKey.replace(':', '_')}.json`);
            await fs.writeJson(filePath, entry, { spaces: 2 });
        } catch (error) {
            this.logError(`Failed to persist to disk: ${fullKey}`, error);
        }
    }
    
    async deleteFromDisk(fullKey) {
        try {
            const filePath = path.join(this.config.basePath, `${fullKey.replace(':', '_')}.json`);
            await fs.remove(filePath);
        } catch (error) {
            this.logError(`Failed to delete from disk: ${fullKey}`, error);
        }
    }
    
    startAutoSave() {
        this.autoSaveTimer = setInterval(async () => {
            try {
                await this.saveAll();
                this.log('Auto-save completed');
            } catch (error) {
                this.logError('Auto-save failed', error);
            }
        }, this.config.autoSaveInterval);
    }
    
    async saveAll() {
        const promises = [];
        for (const [fullKey, entry] of this.memory.entries()) {
            promises.push(this.persistToDisk(fullKey, entry));
        }
        await Promise.all(promises);
    }
    
    async shutdown() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (this.config.autoSave) {
            await this.saveAll();
        }
        
        this.log('Memory system shutdown');
        this.emit('shutdown');
    }
    
    log(message, data = {}) {
        if (this.config.debug) {
            console.log(`[MemorySystem] ${message}`, data);
        }
    }
    
    logError(message, error) {
        console.error(`[MemorySystem] ERROR: ${message}`, error);
    }
}

module.exports = MemorySystem;
