import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";

const ROOT_ROUTES = ["/", "/map-intro", "/welcome", "/home", "/orders", "/refer", "/account"];

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener: PluginListenerHandle | undefined;
    let disposed = false;
    
    const setupListener = async () => {
      try {
        const handle = await App.addListener("backButton", () => {
          if (disposed) return;
           if (location.pathname === "/home") {
             navigate("/welcome", { replace: true });
           } else if (ROOT_ROUTES.includes(location.pathname)) {
            App.exitApp();
          } else {
            navigate(-1);
          }
        });
        if (disposed) {
          void handle.remove();
        } else {
          listener = handle;
        }
      } catch (e) {
        // Not running in Capacitor environment
        console.log("Back button handler not available in web");
      }
    };

    setupListener();

    return () => {
      disposed = true;
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null;
};
