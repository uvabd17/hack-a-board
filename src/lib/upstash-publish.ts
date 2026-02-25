export type UpstashPublishPayload = {
  channel: string
  event: string
  data?: unknown
}

export async function upstashPublish(
  url: string,
  token: string,
  payload: UpstashPublishPayload
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn("[upstashPublish] publish failed", res.status, text)
    }
  } catch (err) {
    console.warn("[upstashPublish] publish error", err)
  }
}
