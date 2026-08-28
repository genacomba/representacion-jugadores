import { Outlet } from "react-router-dom";
import BottomNav from "../components/nav/BottomNav";
import Sidebar from "../components/nav/Sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-pitch-950">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="safe-top mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
