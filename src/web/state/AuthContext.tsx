import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { AuthState, UserRole } from './types'

type AuthAction =
	| { type: 'login'; user: string; role: UserRole }
	| { type: 'logout' }

function reducer(state: AuthState, action: AuthAction): AuthState {
	switch (action.type) {
		case 'login':
			return {
				user: action.user,
				role: action.role,
				isAuthenticated: true
			}
		case 'logout':
			return {
				user: null,
				role: null,
				isAuthenticated: false
			}
		default:
			return state
	}
}

interface AuthContextValue extends AuthState {
	login: (user: string, role: UserRole) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(reducer, {
		user: null,
		role: null,
		isAuthenticated: false
	})

	const value = useMemo<AuthContextValue>(() => ({
		...state,
		login: (user, role) => dispatch({ type: 'login', user, role }),
		logout: () => dispatch({ type: 'logout' })
	}), [state])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}

