'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-gray-900", className)}
      {...props}
    />
  )
}