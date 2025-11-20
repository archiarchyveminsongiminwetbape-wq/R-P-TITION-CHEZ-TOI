import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Search from './pages/Search'
import TeacherProfile from './pages/TeacherProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import DashboardParent from './pages/DashboardParent'
import DashboardTeacher from './pages/DashboardTeacher'
import { ProtectedRoute } from './routes/ProtectedRoute'
import Messages from './pages/Messages'
import ErrorPage from './pages/ErrorPage'
import Admin from './pages/Admin'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <Search /> },
      { path: 'teacher/:id', element: <TeacherProfile /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'reset-password', element: <ResetPassword /> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        ),
      },
      {
        path: 'parent',
        element: (
          <ProtectedRoute role="parent">
            <DashboardParent />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher',
        element: (
          <ProtectedRoute role="teacher">
            <DashboardTeacher />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages/:bookingId',
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export default router
