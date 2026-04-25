import { providerRequest } from '@/lib/providers/http-client';
import { logger } from '@/lib/logger';

// Mock the logger to prevent console spam during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('providerRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('should return success when fetch is successful', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
    });

    const result = await providerRequest('test-provider', 'https://api.test.com', '/test');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ data: 'test' });
    expect(result.attempts).toBe(1);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: '[HTTP] Request success' }));
  });

  it('should retry on 503 errors', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service Unavailable'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ data: 'success' })),
      });

    const result = await providerRequest('test-provider', 'https://api.test.com', '/test', {
      retries: 1,
      retryDelayMs: 1,
    });

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: '[HTTP] Retryable error 503' }));
  });

  it('should fail after max retries', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Permanent Error'),
    });

    const result = await providerRequest('test-provider', 'https://api.test.com', '/test', {
      retries: 1,
      retryDelayMs: 1,
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(2);
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: '[HTTP] Request failed' }));
  });
});
