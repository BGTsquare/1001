/**
 * Analytics Queue Manager Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsQueueManager } from '../queue-manager';

describe('AnalyticsQueueManager', () => {
  let queueManager: AnalyticsQueueManager;
  let mockOnFlush: ReturnType<typeof vi.fn>;
  let mockConfig: any;

  beforeEach(() => {
    mockOnFlush = vi.fn().mockResolvedValue(undefined);
    mockConfig = {
      batchSize: 3,
      flushInterval: 100,
      maxRetries: 2,
    };
    queueManager = new AnalyticsQueueManager(mockOnFlush, mockConfig);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should add events to queue', () => {
      queueManager.enqueue('test_event', { test: 'data' });
      
      const status = queueManager.getStatus();
      expect(status.queueSize).toBe(1);
      expect(status.isProcessing).toBe(false);
    });

    it('should flush immediately when queue reaches batch size', async () => {
      // Add events up to batch size
      queueManager.enqueue('event1');
      queueManager.enqueue('event2');
      queueManager.enqueue('event3'); // Should trigger flush
      
      // Wait for async flush
      await vi.runAllTimersAsync();
      
      expect(mockOnFlush).toHaveBeenCalledTimes(1);
      expect(mockOnFlush).toHaveBeenCalledWith([
        expect.objectContaining({ event: 'event1', retryCount: 0 }),
        expect.objectContaining({ event: 'event2', retryCount: 0 }),
        expect.objectContaining({ event: 'event3', retryCount: 0 }),
      ]);
    });

    it('should schedule flush when queue is not full', () => {
      queueManager.enqueue('test_event');
      
      expect(mockOnFlush).not.toHaveBeenCalled();
      
      // Fast-forward time to trigger scheduled flush
      vi.advanceTimersByTime(100);
      
      expect(mockOnFlush).toHaveBeenCalledTimes(1);
    });
  });

  describe('flush', () => {
    it('should process queued events', async () => {
      queueManager.enqueue('event1', { data: 'test1' });
      queueManager.enqueue('event2', { data: 'test2' });
      
      await queueManager.flush();
      
      expect(mockOnFlush).toHaveBeenCalledWith([
        expect.objectContaining({ event: 'event1', data: { data: 'test1' } }),
        expect.objectContaining({ event: 'event2', data: { data: 'test2' } }),
      ]);
    });

    it('should not flush when already processing', async () => {
      // Make flush take time
      mockOnFlush.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
      
      queueManager.enqueue('event1');
      
      // Start first flush
      const firstFlush = queueManager.flush();
      
      // Try to flush again immediately
      const secondFlush = queueManager.flush();
      
      await Promise.all([firstFlush, secondFlush]);
      
      // Should only be called once
      expect(mockOnFlush).toHaveBeenCalledTimes(1);
    });

    it('should handle flush errors and retry', async () => {
      const error = new Error('Flush failed');
      mockOnFlush.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
      
      queueManager.enqueue('test_event');
      
      await queueManager.flush();
      
      // Should have been called twice (original + retry)
      expect(mockOnFlush).toHaveBeenCalledTimes(2);
      
      // Second call should have incremented retry count
      expect(mockOnFlush).toHaveBeenNthCalledWith(2, [
        expect.objectContaining({ event: 'test_event', retryCount: 1 }),
      ]);
    });

    it('should drop events after max retries', async () => {
      const error = new Error('Persistent failure');
      mockOnFlush.mockRejectedValue(error);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      queueManager.enqueue('failing_event');
      
      // Flush multiple times to exceed max retries
      await queueManager.flush(); // retry count: 1
      await queueManager.flush(); // retry count: 2
      await queueManager.flush(); // should drop event
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Analytics events failed after max retries:',
        expect.objectContaining({
          count: 1,
          events: ['failing_event'],
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return current queue status', () => {
      queueManager.enqueue('event1');
      queueManager.enqueue('event2');
      
      const status = queueManager.getStatus();
      
      expect(status).toEqual({
        queueSize: 2,
        isProcessing: false,
      });
    });
  });

  describe('clear', () => {
    it('should clear all queued events', () => {
      queueManager.enqueue('event1');
      queueManager.enqueue('event2');
      
      expect(queueManager.getStatus().queueSize).toBe(2);
      
      queueManager.clear();
      
      expect(queueManager.getStatus().queueSize).toBe(0);
    });

    it('should cancel scheduled flush', () => {
      queueManager.enqueue('event1');
      
      // Clear before scheduled flush
      queueManager.clear();
      
      // Advance time
      vi.advanceTimersByTime(200);
      
      expect(mockOnFlush).not.toHaveBeenCalled();
    });
  });
});