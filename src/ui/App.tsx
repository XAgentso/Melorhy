import React from 'react'
import { LibraryProvider } from '../web/state/LibraryContext'
import { PlayerProvider } from '../web/state/PlayerContext'
import { PlaylistProvider } from '../web/state/PlaylistContext'
import { AppShell } from './components/AppShell'

export const App: React.FC = () => {
	return (
		<LibraryProvider>
			<PlayerProvider>
				<PlaylistProvider>
					<AppShell />
				</PlaylistProvider>
			</PlayerProvider>
		</LibraryProvider>
	)
}


