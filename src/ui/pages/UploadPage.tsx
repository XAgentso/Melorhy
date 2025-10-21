import React, { useState } from 'react'
import { useAuth } from '../../web/state/AuthContext'
import { useLibrary } from '../../web/state/LibraryContext'
import { addTrack } from '../../lib/supabaseService'

export const UploadPage: React.FC = () => {
	const { user, role } = useAuth()
	const library = useLibrary()
	const [file, setFile] = useState<File | null>(null)
	const [title, setTitle] = useState('')
	const [artist, setArtist] = useState('')
	const [album, setAlbum] = useState('')
	const [artworkUrl, setArtworkUrl] = useState('')
	const [genres, setGenres] = useState('')
	const [isBusy, setIsBusy] = useState(false)
	const [msg, setMsg] = useState<string | null>(null)

	if (role !== 'artist') {
		return (
			<div className="upload-page">
				<header className="topbar">
					<img src="/logo.jpg" alt="Melorhy" className="logo" />
					<h1 className="brand">Upload Music</h1>
					<div className="user-info">
						<span>User: {user}</span>
					</div>
				</header>
				<div className="access-denied">
					<h1>Access Denied</h1>
					<p>Only artists can upload music.</p>
					<p>You are logged in as a {role}.</p>
				</div>
			</div>
		)
	}

	async function submit(): Promise<void> {
		if (!file) return
		setIsBusy(true)
		setMsg(null)
		
		try {
			// Create track object
			const track = {
				title: title || 'Untitled',
				artist: artist || 'Unknown Artist',
				album: album || 'Single',
				artworkUrl: artworkUrl || 'https://picsum.photos/seed/' + Date.now() + '/300/300',
				previewUrl: URL.createObjectURL(file), // Local URL for immediate playback
				genres: genres.split(',').map((s) => s.trim()).filter(Boolean)
			}

			// Try to upload to Supabase first
			try {
				const trackId = await addTrack(track, user || 'demo_artist')
				if (trackId) {
					// Add to local library with Supabase ID
					library.addTrack({ ...track, id: trackId })
					setMsg('Upload successful! Track is now live and synced to the cloud.')
				} else {
					throw new Error('Failed to upload to cloud')
				}
			} catch (supabaseError) {
				console.log('Supabase upload failed, using local storage:', supabaseError)
				// Fallback to local storage
				const trackId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
				library.addTrack({ ...track, id: trackId })
				setMsg('Upload successful! Track saved locally (cloud sync unavailable).')
			}
			
			// Reset form
			setFile(null)
			setTitle('')
			setArtist('')
			setAlbum('')
			setArtworkUrl('')
			setGenres('')
		} catch (e) {
			setMsg('Upload failed. Please try again.')
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<div className="upload-page">
			<header className="topbar">
				<img src="/logo.jpg" alt="Melorhy" className="logo" />
				<h1 className="brand">Upload Music</h1>
				<div className="user-info">
					<span>Artist: {user}</span>
				</div>
			</header>

			<main className="upload-content">
				<div className="upload-form-container">
					<h2>Upload New Track</h2>
					<form className="upload-form" onSubmit={(e) => { e.preventDefault(); submit() }}>
						<div className="form-group">
							<label>Audio File *</label>
							<input 
								type="file" 
								accept="audio/*" 
								onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
								required 
							/>
						</div>

						<div className="form-group">
							<label>Title *</label>
							<input 
								type="text" 
								placeholder="Track title" 
								value={title} 
								onChange={(e) => setTitle(e.target.value)} 
								required 
							/>
						</div>

						<div className="form-group">
							<label>Artist *</label>
							<input 
								type="text" 
								placeholder="Artist name" 
								value={artist} 
								onChange={(e) => setArtist(e.target.value)} 
								required 
							/>
						</div>

						<div className="form-group">
							<label>Album</label>
							<input 
								type="text" 
								placeholder="Album name" 
								value={album} 
								onChange={(e) => setAlbum(e.target.value)} 
							/>
						</div>

						<div className="form-group">
							<label>Artwork URL</label>
							<input 
								type="url" 
								placeholder="https://example.com/artwork.jpg" 
								value={artworkUrl} 
								onChange={(e) => setArtworkUrl(e.target.value)} 
							/>
						</div>

						<div className="form-group">
							<label>Genres</label>
							<input 
								type="text" 
								placeholder="Rock, Pop, Electronic (comma-separated)" 
								value={genres} 
								onChange={(e) => setGenres(e.target.value)} 
							/>
						</div>

						<button type="submit" disabled={!file || isBusy} className="upload-btn">
							{isBusy ? 'Uploading...' : 'Upload & Publish'}
						</button>

						{msg && (
							<div className={`message ${msg.includes('successful') ? 'success' : 'error'}`}>
								{msg}
							</div>
						)}
					</form>
				</div>
			</main>
		</div>
	)
}

