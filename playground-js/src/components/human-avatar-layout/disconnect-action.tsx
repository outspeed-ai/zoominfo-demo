import { PhoneOff } from "lucide-react";
import { Button } from "../button";

export type TDisconnectActionProps = {
  onClick: () => void;
};

export function DisconnectAction(props: TDisconnectActionProps) {
  const { onClick } = props;
  return (
    <Button
      className="rounded-full w-12 h-12"
      variant="destructive"
      size="icon"
      onClick={onClick}
    >
      <PhoneOff className="h-6 w-6" />
    </Button>
  );
}
