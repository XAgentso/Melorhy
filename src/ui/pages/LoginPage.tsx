import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../web/state/AuthContext'

export const LoginPage: React.FC = () => {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [role, setRole] = useState<'artist' | 'listener'>('listener')
	const [error, setError] = useState('')

	// Simple hardcoded credentials for demo
	const validCredentials = {
		artist: { username: 'artist', password: 'artist123' },
		listener: { username: 'listener', password: 'listener123' }
	}

	function handleLogin(e: React.FormEvent) {
		e.preventDefault()
		setError('')
		
		if (!username.trim() || !password.trim()) {
			setError('Please enter both username and password')
			return
		}

		const credentials = validCredentials[role]
		if (username === credentials.username && password === credentials.password) {
			login(username.trim(), role)
			navigate('/music')
		} else {
			setError('Invalid credentials')
		}
	}

	return (
		<div className="login-page">
			<div className="login-container">
				<img src="/logo.jpg" alt="Melorhy" className="logo-large" />
				<h1>Welcome to Melorhy</h1>
				<form onSubmit={handleLogin} className="login-form">
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
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
					{error && <div className="error-message">{error}</div>}
					<button type="submit">Login</button>
				</form>
				<div className="role-info">
					<p><strong>Demo Credentials:</strong></p>
					<p><strong>Artist:</strong> username: artist, password: artist123</p>
					<p><strong>Listener:</strong> username: listener, password: listener123</p>
				</div>
			</div>
		</div>
	)
}

