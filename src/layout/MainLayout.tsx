import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import ForcePasswordChangeModal from "../components/Common/ForcePasswordChangeModal";
import Header from "../components/Dashboard/Header";
import Sidebar from "../components/Dashboard/Sidebar/Sidebar";
import { useAccessDeniedNotice } from "../hooks/useAccessDeniedNotice";

const MainLayout = () => {
  // Explains the bounce when a guarded route sent someone here instead.
  useAccessDeniedNotice();
  /* Everybody who can sign in gets the sidebar — an agent's is simply the
     short version, narrowed in `mergeSidebarForPersona`. */
  const showSidebar = true;

  /**
   * The document does not scroll while the panel is open.
   *
   * The shell is exactly one viewport tall and does its scrolling in the column
   * beside the sidebar. But `100vh` is not always what is actually visible — a
   * horizontal scrollbar, a zoom level, mobile browser chrome — and a few
   * stray pixels of overflow put a second scrollbar down the edge of the
   * window, beside the one the page is really using. Two scrollbars, one of
   * which moves nothing.
   *
   * Locking it here rather than in the stylesheet keeps it to the panel:
   * sign-in and the other pages outside this layout scroll normally.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("app-shell-locked");
    return () => root.classList.remove("app-shell-locked");
  }, []);

  return (
    /*
     * The print classes flatten the shell.
     *
     * On screen this is a fixed-height, scrolling app: `h-dvh`, `overflow-hidden`,
     * a scroll pane inside it. On paper every one of those clips — a document
     * taller than the viewport simply stops at the fold and the rest never
     * prints. Undoing the heights and the overflow lets a long ledger flow
     * across as many sheets as it needs.
     */
    <div className="w-full h-dvh bg-[#F4F7FE] print:h-auto print:bg-white">
      <div className="flex h-full max-w-9xl mx-auto bg-[#F4F7FE] overflow-hidden shadow-sm print:block print:h-auto print:overflow-visible print:shadow-none">
        {/* Sits above every page: an account still on its issued password gets
            no further until it has been replaced. */}
        <ForcePasswordChangeModal />
        {/* Sidebar */}
        {showSidebar && (
          <div className="contents print:hidden">
            <Sidebar />
          </div>
        )}

        {/* Main Content — min-w-0 lets the flex child actually shrink when the
            sidebar expands/collapses; overflow-x-hidden stops wide tables from
            pushing the layout out of alignment. */}
        <div className="relative flex flex-1 flex-col min-w-0 overflow-y-auto overflow-x-hidden transition-[width] duration-300 print:block print:overflow-visible">
          <div className="flex min-w-0 flex-1 flex-col print:block">
            <div className="contents print:hidden">
              <Header />
            </div>
            <main className="flex-1 min-w-0">
              {/* Tighter on a phone: 16px of chrome each side of a 360px screen
                  is nearly a tenth of the width, and every panel inside already
                  carries its own padding. Unchanged from `sm` up. */}
              <div className="p-3 min-w-0 max-w-full sm:p-4 print:p-0">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
