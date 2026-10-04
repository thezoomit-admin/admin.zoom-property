import { LogOut } from "lucide-react";
import { useEffect, useRef } from "react";
import { GoArrowLeft } from "react-icons/go";
import { favicon, logoLight } from "../../../data";
import { logout } from "../../../redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/features/hooks";
import { toggleSidebar } from "../../../redux/features/sidebar/sidebarSlice";
import { useGetCompanySettingsQuery } from "../../../redux/features/company/companyApi";
import NextImage from "../../shared/NextImage";
import AdminMenu from "./AdminMenu";

const Sidebar = () => {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const sidebar = useRef<HTMLElement | null>(null);
  const sidebarOpen = useAppSelector((state: any) => state.sidebar.isActive);
  const isCollapsed = useAppSelector((state: any) => state.sidebar.isCollapsed);
  const dispatch = useAppDispatch();

  /**
   * The company's own name, not a hardcoded one.
   *
   * It is already set in Settings → Company and printed on every receipt
   * and receipt; reading it here means the panel calls the place what its own
   * staff call it. `/company` needs no permission, so this is safe for every
   * persona that sees a sidebar. Falls back while the read is in flight, so the
   * header never flashes empty.
   */
  const { data: company } = useGetCompanySettingsQuery();
  const companyName =
    company?.shortName?.trim() || company?.name?.trim() || "Zoom Property";

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(event.target as Node) ||
        trigger.current.contains(event.target as Node)
      ) {
        return;
      }
      dispatch(toggleSidebar());
    };

    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, [sidebarOpen, dispatch]);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (sidebarOpen && event.key === "Escape") {
        dispatch(toggleSidebar());
      }
    };

    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen, dispatch]);

  return (
    <aside
      ref={sidebar}
      className={`fixed left-0 top-0 z-50 flex flex-col h-full shrink-0 transform bg-white transition-[width,transform] duration-300 ease-in-out border-r border-primary/20
        ${isCollapsed ? "w-[68px]" : "w-[260px]"}
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      style={{ isolation: "isolate" }}
    >
      <div
        className={`flex relative items-center border-b border-primary/20 transition-all duration-300 bg-white/80 backdrop-blur-sm h-[60px] shrink-0 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <div
          className={`flex min-w-0 items-center gap-2.5 ${isCollapsed ? "w-full justify-center" : "pl-1"}`}
        >
          {isCollapsed ? (
            <div className="w-10 h-10 bg-white border border-secondary-100 rounded-xl flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(19,48,80,0.25)]">
              <NextImage
                src={favicon}
                alt={companyName}
                className="h-7 w-7 object-contain"
              />
            </div>
          ) : (
            <>
              {/* The mark shrinks to make room for the name beside it — at 50px
                  it filled a 60px bar on its own and left the panel unnamed. */}
              <NextImage
                src={logoLight}
                alt={companyName}
                accessurl={false}
                className="h-9 w-auto shrink-0 transition-opacity duration-300"
              />
              {/* Name over role: which company this is, then which of its
                  screens you are on. `truncate` because a company may have a
                  long name and the sidebar is 260px wide either way. */}
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[15px] font-bold text-secondary-900">
                  {companyName}
                </p>
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-secondary-400">
                  Admin Panel
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            ref={trigger}
            onClick={() => dispatch(toggleSidebar())}
            className="text-xl text-secondary-600 hover:text-primary hover:bg-primary-50 p-2 rounded-lg transition-colors duration-200 lg:hidden"
          >
            <GoArrowLeft />
          </button>
        </div>
      </div>

      <nav
        className="flex flex-col bg-white flex-1 min-h-0 overflow-x-hidden overflow-y-auto scrollbar-hide"
      >
        {/* `min-h-full` keeps the logout at the foot
            when the menu is short, which is what `mt-auto` did before.
            `shrink-0` is what makes the menu scrollable at all: a flex item
            defaults to `min-height: auto`, which stops it being squeezed below
            its own content, and `min-h-full` overrides exactly that. Without
            it this box collapses to the nav's height, the menu spills out of
            it unseen, and the nav concludes there is nothing to scroll. */}
        <div className="flex min-h-full shrink-0 flex-col">
        <AdminMenu />

        <div
          className={`bg-white w-full sticky bottom-0 mt-auto py-2 border-t border-primary/20 transition-all duration-300 z-50 ${
            isCollapsed ? "px-3" : "px-4"
          }`}
        >
          <button
            onClick={() => dispatch(logout())}
            className={`border w-full rounded-md flex items-center bg-red-500  text-white font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${
              isCollapsed
                ? "px-3 py-[9px] justify-center"
                : "px-4 py-[9px] justify-between"
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            {!isCollapsed && <span className="font-display">Logout</span>}
            <LogOut size={18} />
          </button>
        </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
