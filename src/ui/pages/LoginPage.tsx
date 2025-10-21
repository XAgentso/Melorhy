import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../web/state/AuthContext'

export const LoginPage: React.FC = () => {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [username, setUsername] = useState('')
	const [role, setRole] = useState<'artist' | 'listener'>('listener')

	function handleLogin(e: React.FormEvent) {
		e.preventDefault()
		if (!username.trim()) return
		login(username.trim(), role)
		navigate('/music')
	}

	return (
		<div className="login-page">
			<div className="login-container">
				<img src="/logo.jpg" alt="Melorhy" className="logo-large" />
				<h1>Welcome to Melorhy</h1>
				<form onSubmit={handleLogin} className="login-form">
					<input
						type="text"
						placeholder="Enter your name"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
					<div className="role-selector">
						<label>
							<input
								type="radio"
								name="role"
								value="listener"
								checked={role === 'listener'}
								onChange={(e) => setRole(e.target.value as 'listener')}
							/>
							<span>Listener</span>
						</label>
						<label>
							<input
								type="radio"
								name="role"
								value="artist"
								checked={role === 'artist'}
								onChange={(e) => setRole(e.target.value as 'artist')}
							/>
							<span>Artist</span>
						</label>
					</div>
					<button type="submit">Enter Melorhy</button>
				</form>
				<div className="role-info">
					<p><strong>Listener:</strong> Browse and play music, create playlists</p>
					<p><strong>Artist:</strong> Upload music, manage your tracks</p>
				</div>
			</div>
		</div>
	)
}
