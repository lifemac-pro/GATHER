import { cache } from './cache';

describe('Cache', () => {
  beforeEach(() => {
    // Clear the cache before each test
    cache.clear();
    
    // Mock Date.now to control time
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('stores and retrieves values correctly', () => {
    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');
  });
  
  it('returns undefined for non-existent keys', () => {
    expect(cache.get('non-existent')).toBeUndefined();
  });
  
  it('deletes values correctly', () => {
    cache.set('test-key', 'test-value');
    cache.delete('test-key');
    expect(cache.get('test-key')).toBeUndefined();
  });
  
  it('clears all values correctly', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });
  
  it('expires values after TTL', () => {
    cache.set('test-key', 'test-value', { ttl: 5000 }); // 5 seconds TTL
    
    // Value should exist at current time
    expect(cache.get('test-key')).toBe('test-value');
    
    // Advance time by 3 seconds (still within TTL)
    jest.spyOn(Date, 'now').mockImplementation(() => 4000);
    expect(cache.get('test-key')).toBe('test-value');
    
    // Advance time by 6 seconds (beyond TTL)
    jest.spyOn(Date, 'now').mockImplementation(() => 7000);
    expect(cache.get('test-key')).toBeUndefined();
  });
  
  it('getOrSet returns cached value if available', async () => {
    cache.set('test-key', 'cached-value');
    
    const fn = jest.fn().mockResolvedValue('computed-value');
    const result = await cache.getOrSet('test-key', fn);
    
    expect(result).toBe('cached-value');
    expect(fn).not.toHaveBeenCalled();
  });
  
  it('getOrSet computes and caches value if not available', async () => {
    const fn = jest.fn().mockResolvedValue('computed-value');
    const result = await cache.getOrSet('test-key', fn);
    
    expect(result).toBe('computed-value');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cache.get('test-key')).toBe('computed-value');
  });
});
