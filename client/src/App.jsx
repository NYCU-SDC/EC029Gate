import { useEffect, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

function App() {
	const [user, setUser] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const response = await fetch("/api/auth/me", {
				credentials: "include"
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
				setIsAdmin(data.isAdmin);
			}
		} catch (error) {
			console.error("Auth check failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
				credentials: "include"
			});
			setUser(null);
			setIsAdmin(false);
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<Router>
			<Routes>
				<Route path="/" element={user ? isAdmin ? <Navigate to="/admin" /> : <Navigate to="/admin" /> : <Login onLogin={checkAuth} />} />
				<Route path="/admin" element={user ? <Admin user={user} isAdmin={isAdmin} onLogout={handleLogout} /> : <Navigate to="/" />} />
			</Routes>
		</Router>
	);
}

export default App;
