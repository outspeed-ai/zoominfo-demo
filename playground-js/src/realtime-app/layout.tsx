import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { TAppRouteLocationState } from "../landing/type";
import { TRealtimeAppContext } from "./types";
import React from "react";
import { BASE_ROUTE, HUMAN_AVATAR_APP_ROUTE } from "../constants/routes";
import { RealtimeToast } from "@outspeed/react";
import { TLoaderData } from "../types";

export function RealtimeAppLayout() {
  const location = useLocation();
  const { sessionID } = useLoaderData() as TLoaderData;

  const state = location.state as TAppRouteLocationState;

  const navigate = useNavigate();

  const handleDisconnect = React.useCallback(() => {
    navigate(HUMAN_AVATAR_APP_ROUTE);
  }, [navigate]);

  React.useEffect(() => {
    /**
     * If the state is `undefined` or if `state.sessionID` does not match the
     * expected `sessionID`, we redirect to the homepage.
     *
     * The state is undefined typically due to a bug.
     *
     * `state.sessionID` not matching `sessionID` indicates a browser reload.
     */
    if (!state || state.sessionID !== sessionID) {
      navigate(state?.formURL || BASE_ROUTE);
    }
  }, [state, sessionID]);

  if (!state || !state.config || state.sessionID !== sessionID) {
    return null;
  }

  return (
    <div className="flex justify-center h-dvh w-dvw">
      <RealtimeToast />
      <Outlet
        context={
          {
            config: state.config,
            onDisconnect: handleDisconnect,
          } satisfies TRealtimeAppContext
        }
      />
    </div>
  );
}
