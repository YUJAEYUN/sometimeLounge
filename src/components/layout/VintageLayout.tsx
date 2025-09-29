'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface VintageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export default function VintageLayout({ 
  children, 
  title, 
  subtitle, 
  className = '' 
}: VintageLayoutProps) {
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <Card className="vintage-container p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="vintage-title text-3xl">
              SOMETIME LOUNGE
            </h1>
            <div className="w-full h-px bg-border"></div>
            <p className="vintage-subtitle text-sm">
              한밭대학교 축제 로테이션 소개팅
            </p>
            {title && (
              <>
                <div className="w-full h-px bg-border mt-4"></div>
                <h2 className="vintage-title text-xl mt-4">{title}</h2>
              </>
            )}
            {subtitle && (
              <p className="vintage-subtitle text-sm">{subtitle}</p>
            )}
          </div>

          {/* Content */}
          <div className={`space-y-4 ${className}`}>
            {children}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              © 2025 SOMETIME LOUNGE
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
