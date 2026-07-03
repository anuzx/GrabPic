"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinEvent } from "@/api/events";

interface JoinEventDialogProps {
  open: boolean;
  onClose: () => void;
  onJoined: (eventId: string) => void;
}

export function JoinEventDialog({ open, onClose, onJoined }: JoinEventDialogProps) {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setError("");
    try {
      const result = await joinEvent(code.trim());
      onJoined(result.eventId);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to join event. Check the code.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Join Event</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="code">Event Code</Label>
        <Input
          id="code"
          placeholder="Enter 6-character code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="font-mono text-lg tracking-widest"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={joining}>
          Cancel
        </Button>
        <Button onClick={handleJoin} disabled={code.length !== 6 || joining}>
          {joining ? "Joining..." : "Join"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}