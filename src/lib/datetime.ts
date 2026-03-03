const DATE_TIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

export function parseDateTimeLocal(value: string): Date | null {
    const match = DATE_TIME_LOCAL_RE.exec(value.trim())
    if (!match) return null
    const [, y, mo, d, h, mi] = match
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), 0, 0)
    return Number.isNaN(date.getTime()) ? null : date
}

export function parseDateTimeLocalWithOffset(
    value: string,
    clientTimezoneOffsetMinutes?: number | null
): Date | null {
    const match = DATE_TIME_LOCAL_RE.exec(value.trim())
    if (!match) return null
    const [, y, mo, d, h, mi] = match

    if (typeof clientTimezoneOffsetMinutes === "number" && Number.isFinite(clientTimezoneOffsetMinutes)) {
        const utcMs = Date.UTC(
            Number(y),
            Number(mo) - 1,
            Number(d),
            Number(h),
            Number(mi),
            0,
            0
        ) + clientTimezoneOffsetMinutes * 60 * 1000
        const date = new Date(utcMs)
        return Number.isNaN(date.getTime()) ? null : date
    }

    return parseDateTimeLocal(value)
}

export function formatDateTimeLocal(date: Date | string | null | undefined): string {
    if (!date) return ""
    const d = typeof date === "string" ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
}
