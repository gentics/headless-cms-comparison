import React, { useState, useEffect } from "react";
import CookieConsent from "react-cookie-consent";
import Cookies from 'js-cookie';
import ReactGA from 'react-ga';
import { useLocation } from "react-router-dom";

const Analytics = () => {
  const [accepted, setAccepted] = useState(false);
  function onAccepted() {
    setAccepted(true);
    ReactGA.initialize('UA-77960-5', {
      debug: (process.env.NODE_ENV !== 'production')
    });
  }
  useEffect(() => {
    if (Cookies.get("CookieConsent")) {
      onAccepted();
    }
  }, []);

  const location = useLocation();
  React.useEffect(
    () => {
      if (accepted) {
        ReactGA.pageview(location.pathname + location.search);
      };
    },
    [accepted, location]
  );

  return ( 
    <CookieConsent
      onAccept={onAccepted}
    >This website uses cookies.</CookieConsent>
  );
};
 
export default Analytics;