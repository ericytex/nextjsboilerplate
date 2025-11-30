import { TrendingDownIcon, TrendingUpIcon, Video, Eye, Zap, Heart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string
  description: string
  footerText: string
  trend?: string
  status?: string
  icon: React.ReactNode
}

function MetricCard({ 
  title, 
  value, 
  description, 
  footerText, 
  trend, 
  status,
  icon
}: Omit<MetricCardProps, 'gradient'>) {
  return (
    <Card className="group relative border overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
      {/* Top accent bar */}
      <div className="h-1 bg-muted" />
      
      <CardHeader className="relative pb-4">
        {/* Icon in top right */}
        <div className="absolute right-5 top-5 p-2.5 bg-muted rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="pr-20 space-y-3">
          <CardDescription className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardDescription>
          
          <div className="flex items-baseline justify-between gap-4">
            <CardTitle className="text-4xl md:text-5xl font-bold tabular-nums text-foreground leading-none">
              {value}
            </CardTitle>
            
            {/* Badge */}
            {(trend || status) && (
              <Badge className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-muted text-muted-foreground border shadow-sm">
                {trend ? (
                  <>
                    <TrendingUpIcon className="size-3.5" />
                    {trend}
                  </>
                ) : (
                  status
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardFooter className="flex-col items-start gap-2 pt-4 pb-5 px-6 bg-muted/30 border-t">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {description}
          <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-sm text-muted-foreground">
          {footerText}
        </div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
      <MetricCard
        title="Videos Created"
        value="127"
        description="Up this month"
        footerText="112 videos this month"
        trend="+18.5%"
        icon={<Video className="h-6 w-6" />}
      />
      
      <MetricCard
        title="Total Views"
        value="1.2M"
        description="Growing fast"
        footerText="Across all platforms"
        trend="+32.1%"
        icon={<Eye className="h-6 w-6" />}
      />
      
      <MetricCard
        title="Credits Remaining"
        value="342"
        description="Good balance"
        footerText="Resets monthly"
        status="Active"
        icon={<Zap className="h-6 w-6" />}
      />
      
      <MetricCard
        title="Avg. Engagement"
        value="8.4%"
        description="Above average"
        footerText="Industry avg: 6.2%"
        trend="+2.1%"
        icon={<Heart className="h-6 w-6" />}
      />
    </div>
  )
}
