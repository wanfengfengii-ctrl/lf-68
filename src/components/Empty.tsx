import { cn } from '@/lib/utils'

interface EmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center')}>
      {icon && (
        <div className="text-earth-300 mb-4">
          {icon}
        </div>
      )}
      {title && (
        <p className="text-lg font-medium text-earth-700 mb-2">{title}</p>
      )}
      {description && (
        <p className="text-earth-500 max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
