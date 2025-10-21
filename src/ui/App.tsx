import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../web/state/AuthContext'
import { LibraryProvider } from '../web/state/LibraryContext'
import { PlayerProvider } from '../web/state/PlayerContext'
import { PlaylistProvider } from '../web/state/PlaylistContext'
import { LoginPage } from './pages/LoginPage'
import { MusicPage } from './pages/MusicPage'
import { UploadPage } from './pages/UploadPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export const App: React.FC = () => {
	return (
		<AuthProvider>
			<LibraryProvider>
				<PlayerProvider>
					<PlaylistProvider>
						<Router>
							<Routes>
								<Route path="/login" element={<LoginPage />} />
								<Route path="/music" element={
									<ProtectedRoute>
										<MusicPage />
									</ProtectedRoute>
								} />
								<Route path="/upload" element={
									<ProtectedRoute>
										<UploadPage />
									</ProtectedRoute>
								} />
								<Route path="/" element={<Navigate to="/login" replace />} />
							</Routes>
						</Router>
					</PlaylistProvider>
				</PlayerProvider>
			</LibraryProvider>
		</AuthProvider>
	)
}



