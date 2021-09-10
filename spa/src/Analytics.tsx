import React, { useEffect } from "react";
import CookieConsent, { Cookies } from "react-cookie-consent";
import ReactGA from "react-ga";
import { useLocation } from "react-router-dom";

type PropsType = {
  accepted: boolean;
  setAccepted: (accepted: boolean) => void;
};

const Analytics = ({ accepted, setAccepted }: PropsType) => {
  const onAccepted = (): void => {
    setAccepted(true);
    ReactGA.initialize("UA-77960-5", {
      debug: process.env.NODE_ENV !== "production",
    });
  };

  useEffect(() => {
    if (Cookies.get("CookieConsent")) {
      onAccepted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (accepted) {
      ReactGA.pageview(location.pathname + location.search);
    }
  }, [accepted, location]);

  return (
    <CookieConsent onAccept={onAccepted}>
      This website uses cookies.
    </CookieConsent>
  );
};

export default Analytics;
