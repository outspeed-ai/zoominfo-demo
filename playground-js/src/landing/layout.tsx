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
import { RealtimeExamples } from "./RealtimeExamples";
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
    <div className="flex h-dvh w-dvw flex-col items-center md:items-stretch md:flex-row">
      <div className="flex-1 flex w-full justify-center md:justify-start">
        <div className="flex-1 flex flex-col max-w-lg justify-center md:px-10 md:max-w-2xl p-4">
          <Outlet
            context={
              { onSubmit: handleOnSubmit } satisfies TLayoutOutletContext
            }
          />
        </div>
      </div>
      <div className="w-full justify-center mt-16 flex md:hidden">
        <div className="max-w-lg flex-1 py-4 border-t">
          <Links />
        </div>
      </div>
    </div>
  );
}

function Links(props: React.HTMLProps<HTMLDivElement>) {
  return (
    <div {...props} className={clsx("mt-4", props.className)}>
      <a
        target="_blank"
        href="https://github.com/outspeed-ai/outspeed-js"
        className={buttonVariants({
          variant: "ghost",
          className: "w-12 h-12",
          size: "icon",
        })}
      >
        <Github className="h-6 w-6" />
      </a>
      <a
        target="_blank"
        href="https://docs.outspeed.com/examples/quickstart"
        className={buttonVariants({
          variant: "ghost",
          className: "w-12 h-12",
          size: "icon",
        })}
      >
        <FileIcon className="h-6 w-6" />
      </a>
    </div>
  );
}
