"use client"

import { Button } from "@/components/ui/button"
import { createNewHackathon } from "@/actions/organizer"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function CreateHackathonButton() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        setIsLoading(true)
        try {
            const result = await createNewHackathon()
            if (result.success && result.slug) {
                router.push(`/h/${result.slug}/manage`)
            } else {
                alert("Failed to create hackathon")
                setIsLoading(false)
            }
        } catch (error) {
            alert("Error creating hackathon")
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={handleCreate} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Hackathon
        </Button>
    )
}
