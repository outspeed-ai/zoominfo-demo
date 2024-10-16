import { RealtimeAudioVisualizer } from "@outspeed/react";
import { Track } from "@outspeed/core";

export type TAudioVisualizerContainerProps = {
  track: Track | null;
  label: string;
  hasControls?: boolean;
  threshold?: number;
};

export function AudioVisualizerContainer(
  props: TAudioVisualizerContainerProps
) {
  const { track, threshold } = props;

  return (
    <div className="h-full w-full border rounded-md">
      <RealtimeAudioVisualizer track={track} threshold={threshold} />
    </div>
  );
}
