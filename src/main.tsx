import "@fortawesome/fontawesome-free/css/all.min.css";
import { ConfigProvider } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "./redux/features/store";
import router from "./routes/routes";
import "./styles/index.css";
import { initGlobalNumberInputHandler } from "./utils/globalNumberInputHandler";
import brand from "./theme/brand";

// Prevent text input globally in all numeric fields
initGlobalNumberInputHandler();

const config = {
  token: {
    // Zoom Property brand — the same numbers Tailwind and the charts use.
    colorPrimary: brand.primary,
    // Links take the mid green: the deep green on white reads as body text
    // rather than as a link.
    colorLink: brand.primaryMid,
    colorPrimaryBg: `${brand.primary}18`,
    colorError: brand.danger,
    // Match the Tailwind/global typeface so antd components don't fall back
    // to their own default sans stack.
    fontFamily: '"Montserrat", "Noto Sans Bengali", sans-serif',
  },
  components: {
    // Only buttons use a 7px corner radius.
    Button: {
      borderRadius: 7,
    },
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={config}>
      <Provider store={store}>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </Provider>
    </ConfigProvider>
  </React.StrictMode>
);
