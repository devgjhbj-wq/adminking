import { dotPulse } from 'ldrs';
dotPulse.register();

interface LoadingProps {
  size?: number;
  color?: string;
  className?: string;
}

const Loading = ({ size = 43, color = 'currentColor', className }: LoadingProps) => {
  return (
    <div className={className}>
      <l-dot-pulse
        size={size}
        speed="1.3"
        color={color}
      />
    </div>
  );
};

export default Loading;
