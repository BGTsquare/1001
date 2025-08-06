/**
 * Analytics Event Queue Manager
 * Handles batching and flushing of analytics events
 */

import { analyticsConfig } from './config';
import type { AnalyticsEventData } from './providers/base-provider';

interface QueuedEvent {
  event: string;
  data?: AnalyticsEventData;
  timestamp: number;
  retryCount: number;
}

export class AnalyticsQueueManager {
  private eventQueue: QueuedEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private onFlush: (events: QueuedEvent[]) => Promise<void>,
    private config = analyticsConfig.general
  ) {}

  /**
   * Add event to queue
   */
  enqueue(event: string, data?: AnalyticsEventData): void {
    const queuedEvent: QueuedEvent = {
      event,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.eventQueue.push(queuedEvent);

    // Flush immediately if queue is full or in development
    if (this.shouldFlushImmediately()) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Flush events immediately
   */
  async flush(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    this.clearFlushTimeout();

    const eventsToProcess = this.eventQueue.splice(0, this.config.batchSize);

    try {
      await this.onFlush(eventsToProcess);
    } catch (error) {
      // Re-queue failed events with retry logic
      this.handleFailedEvents(eventsToProcess, error);
    } finally {
      this.isProcessing = false;
      
      // Process remaining events if any
      if (this.eventQueue.length > 0) {
        this.scheduleFlush();
      }
    }
  }

  /**
   * Get queue status
   */
  getStatus(): { queueSize: number; isProcessing: boolean } {
    return {
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear all queued events
   */
  clear(): void {
    this.eventQueue = [];
    this.clearFlushTimeout();
  }

  private shouldFlushImmediately(): boolean {
    return (
      this.eventQueue.length >= this.config.batchSize ||
      process.env.NODE_ENV === 'development'
    );
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flush();
    }, this.config.flushInterval);
  }

  private clearFlushTimeout(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  private handleFailedEvents(events: QueuedEvent[], error: any): void {
    const retriableEvents = events.filter(
      event => event.retryCount < this.config.maxRetries
    );

    // Increment retry count and re-queue
    retriableEvents.forEach(event => {
      event.retryCount++;
      this.eventQueue.unshift(event); // Add to front for priority
    });

    // Log failed events that exceeded retry limit
    const failedEvents = events.filter(
      event => event.retryCount >= this.config.maxRetries
    );

    if (failedEvents.length > 0) {
      console.error('Analytics events failed after max retries:', {
        count: failedEvents.length,
        events: failedEvents.map(e => e.event),
        error: error.message,
      });
    }
  }
}