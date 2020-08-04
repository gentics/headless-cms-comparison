import React, { useState, useEffect } from "react";
import CookieConsent from "react-cookie-consent";
import Cookies from 'js-cookie';

const Analytics: React.FunctionComponent<{}> = () => {
  const [accepted, setAccepted] = useState(false);
  function onAccepted() {
    setAccepted(true);
    console.log("Load GA here...");
  }
  useEffect(() => {
    if (Cookies.get("CookieConsent")) {
      onAccepted();
    }
  }, []);
  return ( 
    <CookieConsent
      onAccept={onAccepted}
    >This website uses cookies.</CookieConsent>
  );
}
 
export default Analytics;