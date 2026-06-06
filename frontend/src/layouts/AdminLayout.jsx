import AppShellLayout from "./AppShellLayout";

const SIDEBAR_STORAGE_KEY = "admin_sidebar_collapsed";

function AdminLayout() {
  return <AppShellLayout isAdmin storageKey={SIDEBAR_STORAGE_KEY} />;
}

export default AdminLayout;
