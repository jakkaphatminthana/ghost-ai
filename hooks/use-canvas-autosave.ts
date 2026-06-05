"use client"

import { useEffect, useRef, useState } from 'react'
import type { CanvasNode, CanvasEdge } from '@/types/canvas'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  debounceMs = 2000
): SaveStatus {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountRef = useRef(true)

  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes, edges }),
        })
        if (res.ok) {
          setSaveStatus('saved')
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
          idleTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          setSaveStatus('error')
        }
      } catch {
        setSaveStatus('error')
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [projectId, nodes, edges, debounceMs])

  return saveStatus
}
