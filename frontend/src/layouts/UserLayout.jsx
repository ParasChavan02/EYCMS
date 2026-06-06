import AppShellLayout from "./AppShellLayout";

const SIDEBAR_STORAGE_KEY = "user_sidebar_collapsed";

function UserLayout() {
  return <AppShellLayout storageKey={SIDEBAR_STORAGE_KEY} />;
}

export default UserLayout;
