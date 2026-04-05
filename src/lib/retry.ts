/**
 * Retry a function with exponential backoff.
 * Designed for judge score submissions on flaky hackathon WiFi.
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number
        delays?: number[]
        onRetry?: (attempt: number, maxAttempts: number) => void
    } = {}
): Promise<T> {
    const { maxAttempts = 3, delays = [0, 2000, 5000], onRetry } = options

    let lastError: unknown
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Wait before retry (skip delay on first attempt)
            if (attempt > 0) {
                const delay = delays[Math.min(attempt, delays.length - 1)]
                onRetry?.(attempt + 1, maxAttempts)
                await new Promise(resolve => setTimeout(resolve, delay))
            }

            // Race the function against a 15s timeout
            const result = await Promise.race([
                fn(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Request timeout")), 15000)
                )
            ])
            return result
        } catch (e) {
            lastError = e
        }
    }
    throw lastError
}
