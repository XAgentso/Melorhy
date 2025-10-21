import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../web/state/AuthContext'

interface RegisterFormData {
	email: string
	username: string
	password: string
	confirmPassword: string
	role: 'artist' | 'listener'
	agreeToTerms: boolean
}

export const RegisterPage: React.FC = () => {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [formData, setFormData] = useState<RegisterFormData>({
		email: '',
		username: '',
		password: '',
		confirmPassword: '',
		role: 'listener',
		agreeToTerms: false
	})
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	// Form validation
	const validateForm = (): boolean => {
		if (!formData.email.trim()) {
			setError('Email is required')
			return false
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			setError('Please enter a valid email address')
			return false
		}
		if (!formData.username.trim()) {
			setError('Username is required')
			return false
		}
		if (formData.username.length < 3) {
			setError('Username must be at least 3 characters')
			return false
		}
		if (!formData.password.trim()) {
			setError('Password is required')
			return false
		}
		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters')
			return false
		}
		if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
			setError('Password must contain uppercase, lowercase, number, and special character')
			return false
		}
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match')
			return false
		}
		if (!formData.agreeToTerms) {
			setError('You must agree to the terms and conditions')
			return false
		}
		return true
	}

	// Handle form submission
	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		
		if (!validateForm()) return

		setIsLoading(true)

		try {
			const response = await fetch('http://localhost:5000/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: formData.email,
					username: formData.username,
					password: formData.password,
					role: formData.role
				})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Registration failed')
			}

			// Store token and login
			localStorage.setItem('melorhy_token', data.token)
			login(data.user.username, data.user.role)
			
			// Redirect to music page
			navigate('/music')

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed')
		} finally {
			setIsLoading(false)
		}
	}

	// Handle input changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target
		const checked = (e.target as HTMLInputElement).checked
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
						<h1>Join Melorhy</h1>
						<p className="login-subtitle">Create your account</p>
					</div>

					{/* Registration Form */}
					<form onSubmit={handleRegister} className="modern-login-form">
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

						{/* Username Field */}
						<div className="form-group">
							<label htmlFor="username" className="form-label">Username</label>
							<div className="input-wrapper">
								<input
									id="username"
									name="username"
									type="text"
									placeholder="Choose a username"
									value={formData.username}
									onChange={handleInputChange}
									className="form-input"
									required
									autoComplete="username"
								/>
								<div className="input-icon">👤</div>
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
									placeholder="Create a strong password"
									value={formData.password}
									onChange={handleInputChange}
									className="form-input"
									required
									autoComplete="new-password"
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

						{/* Confirm Password Field */}
						<div className="form-group">
							<label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
							<div className="input-wrapper">
								<input
									id="confirmPassword"
									name="confirmPassword"
									type={showConfirmPassword ? 'text' : 'password'}
									placeholder="Confirm your password"
									value={formData.confirmPassword}
									onChange={handleInputChange}
									className="form-input"
									required
									autoComplete="new-password"
								/>
								<button
									type="button"
									className="password-toggle"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
								>
									{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
								</button>
							</div>
						</div>

						{/* Role Selection */}
						<div className="form-group">
							<label htmlFor="role" className="form-label">Account Type</label>
							<select
								id="role"
								name="role"
								value={formData.role}
								onChange={handleInputChange}
								className="form-input"
								required
							>
								<option value="listener">Listener - Browse and play music</option>
								<option value="artist">Artist - Upload and manage music</option>
							</select>
						</div>

						{/* Terms Agreement */}
						<div className="form-group">
							<label className="checkbox-wrapper">
								<input
									name="agreeToTerms"
									type="checkbox"
									checked={formData.agreeToTerms}
									onChange={handleInputChange}
									className="checkbox-input"
									required
								/>
								<span className="checkbox-label">
									I agree to the <Link to="/terms" className="forgot-link">Terms of Service</Link> and <Link to="/privacy" className="forgot-link">Privacy Policy</Link>
								</span>
							</label>
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
									Creating account...
								</>
							) : (
								'Create Account'
							)}
						</button>
					</form>

					{/* Sign In Link */}
					<div className="signup-section">
						<p>Already have an account?</p>
						<Link to="/login" className="signup-link">
							Sign in to Melorhy
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
