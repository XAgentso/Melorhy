import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../web/state/AuthContext'

interface LoginFormData {
	email: string
	password: string
	rememberMe: boolean
}


export const LoginPage: React.FC = () => {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [formData, setFormData] = useState<LoginFormData>({
		email: '',
		password: '',
		rememberMe: false
	})
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	// Form validation
	const validateForm = (): boolean => {
		if (!formData.email.trim()) {
			setError('Email is required')
			return false
		}
		if (!formData.password.trim()) {
			setError('Password is required')
			return false
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			setError('Please enter a valid email address')
			return false
		}
		return true
	}

	// Handle form submission with secure authentication
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		
		if (!validateForm()) return

		setIsLoading(true)

		try {
			// Try backend authentication first
			try {
				const response = await fetch('http://localhost:5000/api/auth/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						email: formData.email,
						password: formData.password,
						rememberMe: formData.rememberMe
					}),
					mode: 'cors'
				})

				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Login failed')
				}

				// Store token securely
				if (formData.rememberMe) {
					localStorage.setItem('melorhy_token', data.token)
				} else {
					sessionStorage.setItem('melorhy_token', data.token)
				}

				// Update auth context
				login(data.user.username, data.user.role)

				// Redirect to music page
				navigate('/music')
				return
			} catch (backendError) {
				console.log('Backend not available, using demo authentication')
			}

			// Fallback to demo authentication
			const demoUsers = {
				'artist@melorhy.com': { password: 'Artist123!', role: 'artist', username: 'Artist' },
				'listener@melorhy.com': { password: 'Listener123!', role: 'listener', username: 'Listener' }
			}

			const user = demoUsers[formData.email as keyof typeof demoUsers]
			if (!user || user.password !== formData.password) {
				throw new Error('Invalid email or password')
			}

			// Store demo token
			const demoToken = `demo_${user.role}_${Date.now()}`
			if (formData.rememberMe) {
				localStorage.setItem('melorhy_token', demoToken)
			} else {
				sessionStorage.setItem('melorhy_token', demoToken)
			}

			// Update auth context
			login(user.username, user.role as 'artist' | 'listener')

			// Redirect to music page
			navigate('/music')

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed')
		} finally {
			setIsLoading(false)
		}
	}

	// Handle input changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}))
		// Clear error when user starts typing
		if (error) setError('')
	}

	return (
		<div className="modern-login-page">
			<div className="login-background">
				<div className="login-container">
					{/* Header */}
					<div className="login-header">
						<img src="/logo.jpg" alt="Melorhy" className="logo-large" />
						<h1>Welcome to Melorhy</h1>
						<p className="login-subtitle">Sign in to your account</p>
					</div>

					{/* Login Form */}
					<form onSubmit={handleLogin} className="modern-login-form">
						{/* Email Field */}
						<div className="form-group">
							<label htmlFor="email" className="form-label">Email</label>
							<div className="input-wrapper">
								<input
									id="email"
									name="email"
									type="email"
									placeholder="Enter your email"
									value={formData.email}
									onChange={handleInputChange}
									className="form-input"
									required
									autoComplete="email"
								/>
								<div className="input-icon">📧</div>
							</div>
						</div>

						{/* Password Field */}
						<div className="form-group">
							<label htmlFor="password" className="form-label">Password</label>
							<div className="input-wrapper">
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleInputChange}
									className="form-input"
									required
									autoComplete="current-password"
								/>
								<button
									type="button"
									className="password-toggle"
									onClick={() => setShowPassword(!showPassword)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? '👁️' : '👁️‍🗨️'}
								</button>
							</div>
						</div>

						{/* Remember Me & Forgot Password */}
						<div className="form-options">
							<label className="checkbox-wrapper">
								<input
									name="rememberMe"
									type="checkbox"
									checked={formData.rememberMe}
									onChange={handleInputChange}
									className="checkbox-input"
								/>
								<span className="checkbox-label">Remember me</span>
							</label>
							<Link to="/forgot-password" className="forgot-link">
								Forgot password?
							</Link>
						</div>

						{/* Error Message */}
						{error && (
							<div className="error-message">
								<span className="error-icon">⚠️</span>
								{error}
							</div>
						)}

						{/* Submit Button */}
						<button 
							type="submit" 
							className="login-button"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<span className="spinner"></span>
									Signing in...
								</>
							) : (
								'Sign in'
							)}
						</button>
					</form>

					{/* Sign Up Link */}
					<div className="signup-section">
						<p>Don't have an account?</p>
						<Link to="/register" className="signup-link">
							Sign up for Melorhy
						</Link>
					</div>

					{/* Demo Credentials */}
					<div className="demo-credentials">
						<p><strong>Demo Accounts:</strong></p>
						<div className="demo-account">
							<p><strong>Artist:</strong> artist@melorhy.com / Artist123!</p>
						</div>
						<div className="demo-account">
							<p><strong>Listener:</strong> listener@melorhy.com / Listener123!</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

