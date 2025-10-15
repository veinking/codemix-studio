import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipod|android|blackberry|windows phone|webos/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsTouchDevice(hasTouch);
      
      if (isMobile) {
        setDeviceType("mobile");
      } else if (isTablet) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    detectDevice();
    window.addEventListener("resize", detectDevice);
    
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  return { deviceType, isTouchDevice, isMobile: deviceType === "mobile" };
};
