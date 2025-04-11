import { logger, handleApiError } from './logger';

describe('Logger', () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Clear logs before each test
    logger.clearLogs();
  });
  
  afterAll(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
  
  it('logs debug messages correctly', () => {
    logger.debug('Test debug message');
    expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('DEBUG: Test debug message'));
  });
  
  it('logs info messages correctly', () => {
    logger.info('Test info message');
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('INFO: Test info message'));
  });
  
  it('logs warning messages correctly', () => {
    logger.warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('WARN: Test warning message'));
  });
  
  it('logs error messages correctly', () => {
    logger.error('Test error message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ERROR: Test error message'));
  });
  
  it('includes context in log messages when provided', () => {
    const context = { userId: '123', action: 'test' };
    logger.info('Test with context', context);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`INFO: Test with context ${JSON.stringify(context)}`)
    );
  });
  
  it('stores logs in memory', () => {
    logger.info('Test log storage');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test log storage');
    expect(logs[0].level).toBe('info');
  });
  
  it('clears logs when requested', () => {
    logger.info('Test log 1');
    logger.info('Test log 2');
    expect(logger.getLogs()).toHaveLength(2);
    
    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    console.error = jest.fn();
  });
  
  it('handles Error objects correctly', () => {
    const error = new Error('Test error');
    const result = handleApiError(error);
    
    expect(result).toEqual({
      message: 'Test error',
      status: 500
    });
    expect(console.error).toHaveBeenCalled();
  });
  
  it('handles string errors correctly', () => {
    const result = handleApiError('String error');
    
    expect(result).toEqual({
      message: 'String error',
      status: 500
    });
  });
  
  it('sets 404 status for not found errors', () => {
    const error = new Error('Resource not found');
    const result = handleApiError(error);
    
    expect(result).toEqual({
      message: 'Resource not found',
      status: 404
    });
  });
  
  it('sets 401 status for unauthorized errors', () => {
    const error = new Error('Unauthorized access');
    const result = handleApiError(error);
    
    expect(result).toEqual({
      message: 'Unauthorized access',
      status: 401
    });
  });
  
  it('sets 400 status for validation errors', () => {
    const error = new Error('Validation failed');
    const result = handleApiError(error);
    
    expect(result).toEqual({
      message: 'Validation failed',
      status: 400
    });
  });
  
  it('includes context in the log when provided', () => {
    const error = new Error('Test error');
    const context = { userId: '123', action: 'test' };
    handleApiError(error, context);
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('ERROR: Test error'),
      expect.objectContaining(context)
    );
  });
});
