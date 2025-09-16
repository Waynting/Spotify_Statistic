import { create } from 'zustand'
import { Device } from '../types'

interface PlayerState {
  devices: Device[]
  activeDevice: Device | null
  isPlaying: boolean
  currentTrack: any | null
  setDevices: (devices: Device[]) => void
  setActiveDevice: (device: Device | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTrack: (track: any) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  devices: [],
  activeDevice: null,
  isPlaying: false,
  currentTrack: null,
  setDevices: (devices) => set({ devices }),
  setActiveDevice: (device) => set({ activeDevice: device }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
}))