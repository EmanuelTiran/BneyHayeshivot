/* eslint-disable react/prop-types */

import {
    Navigate,
    useLocation,
  } from 'react-router-dom';
  
  import {
    useAuth,
  } from '../context/authContext';
  
  import {
    ROUTES,
  } from '../../constants/routes';
  
  function AdminRoute({
    children,
  }) {
    const location =
      useLocation();
  
    const {
      loading,
      isAdmin,
    } = useAuth();
  
    if (loading) {
      return (
        <div
          dir="rtl"
          className="flex min-h-[55vh] items-center justify-center px-4"
        >
          <div className="rounded-2xl border border-[#cfa756]/35 bg-[#0d2340] px-8 py-7 text-center shadow-xl">
            <span
              className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-[#f7f4e9]/20 border-t-[#cfa756]"
              aria-hidden="true"
            />
  
            <p className="mt-4 font-semibold text-[#f7f4e9]">
              בודק הרשאת מנהל...
            </p>
          </div>
        </div>
      );
    }
  
    if (!isAdmin()) {
      return (
        <Navigate
          to={ROUTES.LOGIN}
          replace
          state={{
            from:
              location.pathname,
            reason:
              'admin_required',
          }}
        />
      );
    }
  
    return children;
  }
  
  export default AdminRoute;