/**
 * Adaptive polling controller that adjusts poll frequency based on network quality.
 * Designed for hackathon WiFi where 200 people share one AP.
 *
 * Network tiers:
 *   good     (<300ms avg RTT)  → 5s poll
 *   degraded (300-800ms)       → 10s poll
 *   poor     (>800ms)          → 20s poll
 *   offline  (3+ failures)     → 30s with backoff to 60s
 */

type NetworkQuality = "good" | "degraded" | "poor" | "offline"

const INTERVALS: Record<NetworkQuality, number> = {
    good: 5000,
    degraded: 10000,
    poor: 20000,
    offline: 30000,
}

const MAX_OFFLINE_INTERVAL = 60000
const RTT_WINDOW_SIZE = 5

export class AdaptivePollController {
    private timerId: ReturnType<typeof setTimeout> | null = null
    private fetchFn: (() => Promise<void>) | null = null
    private isFetching = false
    private queuedForceNow = false
    private rttWindow: number[] = []
    private consecutiveFailures = 0
    private currentInterval = INTERVALS.good
    private stopped = false

    getNetworkQuality(): NetworkQuality {
        if (this.consecutiveFailures >= 3) return "offline"
        if (this.rttWindow.length === 0) return "good"
        const avg = this.rttWindow.reduce((a, b) => a + b, 0) / this.rttWindow.length
        if (avg > 800) return "poor"
        if (avg > 300) return "degraded"
        return "good"
    }

    getInterval(): number {
        const quality = this.getNetworkQuality()
        if (quality === "offline") {
            // Exponential backoff for offline: 30s, 45s, 60s (capped)
            return Math.min(INTERVALS.offline + this.consecutiveFailures * 10000, MAX_OFFLINE_INTERVAL)
        }
        return INTERVALS[quality]
    }

    start(fetchFn: () => Promise<void>) {
        this.fetchFn = fetchFn
        this.stopped = false
        this.scheduleNext()
    }

    stop() {
        this.stopped = true
        if (this.timerId) {
            clearTimeout(this.timerId)
            this.timerId = null
        }
    }

    /** Trigger an immediate fetch (e.g., on socket event). Deduplicates with in-flight requests. */
    forceNow() {
        if (this.isFetching) {
            this.queuedForceNow = true
            return
        }
        if (this.timerId) {
            clearTimeout(this.timerId)
            this.timerId = null
        }
        this.executeFetch()
    }

    private scheduleNext() {
        if (this.stopped) return
        this.currentInterval = this.getInterval()
        this.timerId = setTimeout(() => {
            if (document.visibilityState === "hidden") {
                // Tab hidden — skip this poll and reschedule
                this.scheduleNext()
                return
            }
            this.executeFetch()
        }, this.currentInterval)
    }

    private async executeFetch() {
        if (!this.fetchFn || this.isFetching || this.stopped) return
        this.isFetching = true
        this.queuedForceNow = false

        const start = performance.now()
        try {
            await this.fetchFn()
            const rtt = performance.now() - start
            this.rttWindow.push(rtt)
            if (this.rttWindow.length > RTT_WINDOW_SIZE) this.rttWindow.shift()
            this.consecutiveFailures = 0
        } catch {
            this.consecutiveFailures++
        } finally {
            this.isFetching = false
            // If a forceNow was requested while we were fetching, do it now
            if (this.queuedForceNow && !this.stopped) {
                this.queuedForceNow = false
                this.executeFetch()
            } else {
                this.scheduleNext()
            }
        }
    }
}
