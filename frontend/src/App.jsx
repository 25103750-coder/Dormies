// ============================================================================================
// FILE: frontend/src/App.jsx
// PART OF: Front end > Routes
// WHAT IT DOES: The list of pages (URLs). Private pages need a login and the right role; wrong role
//               shows "No access", unknown URL shows "Not found".
// ============================================================================================
import React, { useEffect, useState } from 'react'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { useAuth, homeFor } from './context/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Loader from './components/Loader.jsx'
import ServerError from './components/ServerError.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Residents from './pages/Residents.jsx'
import Rooms from './pages/Rooms.jsx'
import Billing from './pages/Billing.jsx'
import Maintenance from './pages/Maintenance.jsx'
import Transfers from './pages/Transfers.jsx'
import Visitors from './pages/Visitors.jsx'
import Reports from './pages/Reports.jsx'
import Announcements from './pages/Announcements.jsx'
import Notifications from './pages/Notifications.jsx'
import Settings from './pages/Settings.jsx'
import { PortalHome, PortalBilling, PortalRequests } from './pages/Portal.jsx'

// route that only lets signed in users (with the right role) through
function Private({ roles, children, ...rest }) {
  const { user } = useAuth()
  const location = useLocation()
  return (
    <Route {...rest}>
      {!user ? (
        // not signed in: go to the login page and remember where they wanted to go
        <Redirect to={{ pathname: '/login', state: { from: location.pathname } }} />
      ) : roles && !roles.includes(user.role) ? (
        <Forbidden />
      ) : (
        <AppLayout>{children}</AppLayout>
      )}
    </Route>
  )
}

// Page shown when the role is not allowed to open the page.
function Forbidden() {
  const { user } = useAuth()
  return (
    <AppLayout>
      <div className="state err" role="alert">
        <div className="big">🚫</div>
        <h3>Access denied</h3>
        <p>Your account ({user.role}) does not have permission to open this page.</p>
        <p style={{ marginTop: 14 }}><Link className="btn" to={homeFor(user)}>Go to my dashboard</Link></p>
      </div>
    </AppLayout>
  )
}

// Page shown for a URL that does not exist.
function NotFound() {
  const { user } = useAuth()
  return (
    <div className="state" style={{ paddingTop: '18vh' }}>
      <div className="big">🧭</div>
      <h3>Page not found</h3>
      <p>The page you are looking for does not exist.</p>
      <p style={{ marginTop: 14 }}><Link className="btn" to={user ? homeFor(user) : '/login'}>{user ? 'Back to my dashboard' : 'Go to sign in'}</Link></p>
    </div>
  )
}

// shows the loader for a moment when the user changes section (same idea as KittyPal)
function Pages({ children }) {
  const { pathname } = useLocation()
  const section = pathname.split('/').slice(0, 2).join('/')
  const [busy, setBusy] = useState(true)
  useEffect(() => {
    setBusy(true)
    const t = setTimeout(() => setBusy(false), 450)
    return () => clearTimeout(t)
  }, [section])
  return busy ? <Loader full /> : children
}

// Top level: loader while starting, server error screen, then the list of pages.
export default function App() {
  const { user, booting, bootError, boot, toast, closeToast } = useAuth()

  if (booting) return <Loader full text="Starting Dormies" />
  if (bootError) return <ServerError full message={bootError.message} onRetry={boot} />

  return (
    <>
      <Pages>
        <Switch>
          <Route exact path="/"><Redirect to={user ? homeFor(user) : '/login'} /></Route>
          <Route path="/login"><Login /></Route>

          <Private path="/dashboard" roles={['Admin', 'Staff']}><Dashboard /></Private>
          <Private path="/residents" roles={['Admin', 'Staff']}><Residents /></Private>
          <Private path="/rooms" roles={['Admin', 'Staff']}><Rooms /></Private>
          <Private path="/billing" roles={['Admin', 'Staff']}><Billing /></Private>
          <Private path="/maintenance" roles={['Admin', 'Staff']}><Maintenance /></Private>
          <Private path="/transfers" roles={['Admin', 'Staff']}><Transfers /></Private>
          <Private path="/visitors" roles={['Admin', 'Staff']}><Visitors /></Private>
          <Private path="/reports" roles={['Admin']}><Reports /></Private>
          <Private path="/announcements" roles={['Admin', 'Staff']}><Announcements /></Private>
          <Private path="/settings" roles={['Admin', 'Staff', 'Resident']}><Settings /></Private>

          <Private path="/portal/billing" roles={['Resident']}><PortalBilling /></Private>
          <Private path="/portal/requests" roles={['Resident']}><PortalRequests /></Private>
          <Private path="/portal" roles={['Resident']}><PortalHome /></Private>

          <Private path="/notifications"><Notifications /></Private>
          <Route><NotFound /></Route>
        </Switch>
      </Pages>

      {toast && (
        <div className={`toast ${toast.type}`} role={toast.type === 'err' ? 'alert' : 'status'}>
          <span>{toast.type === 'err' ? '⚠️ ' : toast.type === 'warn' ? '❗ ' : '✅ '}{toast.msg}</span>
          <button className="toast-x" onClick={closeToast} aria-label="Close message">✕</button>
        </div>
      )}
    </>
  )
}
