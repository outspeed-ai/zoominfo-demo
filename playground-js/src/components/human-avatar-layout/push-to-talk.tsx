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
  remoteAudioTrack?: Track | null;
};

export function MediaAction(props: TMediaActionProps) {
  const { track, On, Off, dataChannel, remoteAudioTrack } = props;
  const [isEnabled, setIsEnabled] = React.useState(false);
  const lastMicState = React.useRef({
    hasUpdated: false,
    wasEnabled: false,
  });

  const handleEnableMic = React.useCallback(() => {
    if (!track) return;

    console.log("handleEnableMic", remoteAudioTrack?.isMute());
    if (remoteAudioTrack && !remoteAudioTrack.isMute()) {
      remoteAudioTrack.pause();
    }

    if (track.isMute()) {
      track.resume();
    }

    if (dataChannel) {
      dataChannel.send({ type: "interrupt" });
    }

    setIsEnabled(true);
  }, [track, dataChannel, remoteAudioTrack]);

  const handleDisableMic = React.useCallback(() => {
    if (!track) {
      return;
    }

    console.log("handleDisableMic", remoteAudioTrack?.isMute());
    if (remoteAudioTrack && remoteAudioTrack.isMute()) {
      remoteAudioTrack.resume();
    }

    if (!track.isMute()) {
      track.pause();
    }

    setIsEnabled(false);
  }, [track, remoteAudioTrack]);

  const handlePressStart = React.useCallback(() => {
    handleEnableMic();
  }, [handleEnableMic]);

  const handlePressEnd = React.useCallback(() => {
    handleDisableMic();
  }, [handleDisableMic]);

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space" && !lastMicState.current.hasUpdated) {
        lastMicState.current.hasUpdated = true;
        handleEnableMic();
      }
    },
    [handleEnableMic]
  );

  const handleKeyUp = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space" && lastMicState.current.hasUpdated) {
        handleDisableMic();
        lastMicState.current.hasUpdated = false;
      }
    },
    [handleDisableMic]
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
  }, [track, isEnabled]);

  return (
    <div className="flex flex-col items-center">
      <Button
        className={
          "rounded-full w-16 h-16 transition-colors duration-300 border-2 border-white hover:border-green-500"
        }
        variant="outline"
        size="icon"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
      >
        {isEnabled ? <On className="h-8 w-8" /> : <Off className="h-8 w-8" />}
      </Button>
      <span className="mt-2 text-sm text-white-700">
        Press and Hold to talk
      </span>
    </div>
  );
}
