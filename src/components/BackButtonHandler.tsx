import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";

const ROOT_ROUTES = ["/home", "/orders", "/refer", "/account"];

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener: any;
    
    const setupListener = async () => {
      try {
        listener = await App.addListener("backButton", () => {
          if (ROOT_ROUTES.includes(location.pathname)) {
            App.exitApp();
          } else {
            navigate(-1);
          }
        });
      } catch (e) {
        // Not running in Capacitor environment
        console.log("Back button handler not available in web");
      }
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null;
};
