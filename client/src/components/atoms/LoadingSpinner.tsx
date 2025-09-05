interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  return (
    <span className={`loading loading-spinner loading-${size}`}></span>
  );
};

export default LoadingSpinner;
