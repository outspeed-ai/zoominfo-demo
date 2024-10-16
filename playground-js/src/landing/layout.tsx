import clsx from "clsx";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { buttonVariants } from "../components/button";
import { FileIcon, Github } from "lucide-react";
import { TAppRouteLocationState, TLayoutOutletContext } from "./type";
import React from "react";
import { TRealtimeConfig } from "@outspeed/core";
import { TRealtimeWebSocketConfig } from "@outspeed/core";
import { isChrome, isSafari } from "react-device-detect";
import { BrowserNotSupported } from "../components/browser-not-supported";
import { TLoaderData } from "../types";

export type TLandingProps = {};

export function LandingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionID } = useLoaderData() as TLoaderData;

  const [isBrowserSupported, setIsBrowserSupported] = React.useState(false);

  const handleOnSubmit = React.useCallback(
    (config: TRealtimeConfig | TRealtimeWebSocketConfig, pathname: string) => {
      navigate(pathname, {
        state: {
          config,
          sessionID,
          formURL: location.pathname,
        } satisfies TAppRouteLocationState,
      });
    },
    [navigate, location.pathname]
  );

  const checkBrowser = React.useCallback(() => {
    if (!isChrome && !isSafari) {
      setIsBrowserSupported(false);
    } else {
      setIsBrowserSupported(true);
    }
  }, []);

  React.useEffect(() => {
    checkBrowser();
  }, [checkBrowser]);

  if (!isBrowserSupported) {
    return <BrowserNotSupported />;
  }

  return (
    <div className="p-4 h-screen w-screen flex justify-center">
      <Outlet
        context={{ onSubmit: handleOnSubmit } satisfies TLayoutOutletContext}
      />
    </div>
  );
}
