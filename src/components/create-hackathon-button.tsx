"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createNewHackathon } from "@/actions/organizer"
import { Plus, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function CreateHackathonButton() {
    const [isLoading, setIsLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [customSlug, setCustomSlug] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    const handleCreate = async (useCustomSlug: boolean) => {
        setIsLoading(true)
        setError("")
        try {
            const result = await createNewHackathon(useCustomSlug ? customSlug : undefined)
            if (result.success && result.slug) {
                router.push(`/h/${result.slug}/manage`)
            } else {
                setError(result.error || "Failed to create hackathon")
                setIsLoading(false)
            }
        } catch (error) {
            setError("Error creating hackathon")
            setIsLoading(false)
        }
    }

    const handleQuickCreate = () => {
        handleCreate(false)
    }

    const handleCustomCreate = () => {
        if (!customSlug.trim()) {
            setError("Please enter a slug or use quick create")
            return
        }
        handleCreate(true)
    }

    if (showDialog) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Create New Hackathon</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose a custom URL slug or let us generate one for you
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="slug">Custom Slug (Optional)</Label>
                            <Input
                                id="slug"
                                placeholder="my-awesome-hackathon"
                                value={customSlug}
                                onChange={(e) => {
                                    setCustomSlug(e.target.value)
                                    setError("")
                                }}
                                disabled={isLoading}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                URL: <span className="font-mono">hackaboard.com/h/{customSlug || "your-slug"}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Only lowercase letters, numbers, and dashes allowed
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleQuickCreate}
                            disabled={isLoading}
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            Quick Create
                        </Button>
                        <Button
                            onClick={handleCustomCreate}
                            disabled={isLoading || !customSlug.trim()}
                            className="flex-1 gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            Create
                        </Button>
                    </div>

                    <Button
                        onClick={() => setShowDialog(false)}
                        variant="ghost"
                        className="w-full"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Hackathon
        </Button>
    )
}

