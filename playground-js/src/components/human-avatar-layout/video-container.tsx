import { RealtimeAudio } from "@outspeed/react";
import { Track } from "@outspeed/core";
import { RealtimeVideo } from "./realtime-video";

export type TVideContainerProps = {
  track: Track | null;
  label: string;
  hasControls?: {
    audio: Track | null;
  };
};

export function VideContainer(props: TVideContainerProps) {
  const { track, label, hasControls } = props;

  return (
    <div className="flex-1 relative group rounded-lg border max-h-72 sm:max-h-[500px]">
      {hasControls && (
        <div className="absolute top-2 right-2 opacity-0 space-x-3 group-hover:opacity-100">
          <RealtimeAudio track={hasControls.audio} />
        </div>
      )}
      <RealtimeVideo track={track} />
      <div className="absolute bottom-2 text-sm left-2 px-2 py-1 bg-background rounded-md font-bold">
        {label}
      </div>
    </div>
  );
}
