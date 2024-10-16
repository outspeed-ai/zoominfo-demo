import { Button } from "../button";
import React from "react";
import { DataChannel, Track } from "@outspeed/core";
import { LucideProps } from "lucide-react";

export type TMediaActionProps = {
  track: Track | null;
  On: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  Off: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  dataChannel?: DataChannel<unknown> | null;
};

export function MediaAction(props: TMediaActionProps) {
  const { track, On, Off, dataChannel } = props;
  const [isEnabled, setIsEnabled] = React.useState(false);
  const lastMicState = React.useRef({
    hasUpdated: false,
    wasEnabled: false,
  });

  const handleEnableMic = React.useCallback(() => {
    if (!track) return;

    if (track.isMute()) {
      track.resume();
    }

    if (dataChannel) {
      dataChannel.send({ type: "interrupt" });
    }

    setIsEnabled(true);
  }, [track, dataChannel]);

  const handleDisableMic = React.useCallback(() => {
    if (!track) {
      return;
    }

    if (!track.isMute()) {
      track.pause();
    }

    setIsEnabled(false);
  }, [track]);

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      const lastState = lastMicState.current;
      if (lastState.hasUpdated) {
        return;
      }

      if (!isEnabled) {
        lastMicState.current.hasUpdated = true;
        lastMicState.current.wasEnabled = false;
      } else {
        lastMicState.current.hasUpdated = true;
        lastMicState.current.wasEnabled = true;
      }

      if (event.code === "Space") {
        handleEnableMic();
      }
    },
    [handleEnableMic, isEnabled]
  );

  const handleKeyUp = React.useCallback(
    (event: KeyboardEvent) => {
      const lastState = lastMicState.current;
      if (!lastState.hasUpdated) return;

      if (event.code === "Space" && !lastState.wasEnabled) {
        handleDisableMic();
      }

      lastMicState.current.hasUpdated = false;
    },
    [handleDisableMic, isEnabled]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  React.useEffect(() => {
    if (track && !track.isMute() && !isEnabled) {
      track.pause();
    }
  }, [track]);

  return (
    <Button
      className={"rounded-full w-16 h-16" + (!isEnabled ? " bg-muted" : "")}
      variant="outline"
      size="icon"
      onClick={isEnabled ? handleDisableMic : handleEnableMic}
    >
      {isEnabled ? <On className="h-8 w-8" /> : <Off className="h-8 w-8" />}
    </Button>
  );
}
