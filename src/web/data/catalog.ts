import type { Track } from '../state/types'

// Public domain / CC sample previews from samplelib and other sources
// Keep URLs CORS-friendly
export const sampleTracks: Track[] = [
	{
		id: 'sample-1',
		title: 'Acoustic Breeze',
		artist: 'Benjamin Tissot',
		album: 'Bensound Collection',
		artworkUrl: 'https://picsum.photos/seed/acoustic/300/300',
		previewUrl: 'https://samplelib.com/lib/preview/mp3/sample-6s.mp3',
		durationSec: 208,
		genres: ['Acoustic', 'Instrumental']
	},
	{
		id: 'sample-2',
		title: 'Epic Trailer',
		artist: 'Scott Buckley',
		album: 'Creative Commons',
		artworkUrl: 'https://picsum.photos/seed/epic/300/300',
		previewUrl: 'https://samplelib.com/lib/preview/mp3/sample-9s.mp3',
		durationSec: 146,
		genres: ['Cinematic']
	},
	{
		id: 'sample-3',
		title: 'LoFi Study',
		artist: 'FASSounds',
		album: 'LoFi Collection',
		artworkUrl: 'https://picsum.photos/seed/lofi/300/300',
		previewUrl: 'https://samplelib.com/lib/preview/mp3/sample-12s.mp3',
		durationSec: 180,
		genres: ['LoFi', 'Chill']
	},
	{
		id: 'sample-4',
		title: 'Corporate Uplift',
		artist: 'Mixaund',
		album: 'Corporate Themes',
		artworkUrl: 'https://picsum.photos/seed/corporate/300/300',
		previewUrl: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
		durationSec: 210,
		genres: ['Corporate']
	}
]


