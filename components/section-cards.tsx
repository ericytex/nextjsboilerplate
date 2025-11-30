import { TrendingDownIcon, TrendingUpIcon, Video, Eye, Zap, Heart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 lg:px-0">
      <Card className="@container/card border-2 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-cyan-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <CardHeader className="relative">
          <div className="absolute right-4 top-4 p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
            <Video className="h-5 w-5 text-white" />
          </div>
          <CardDescription className="text-blue-700 dark:text-blue-300 font-medium">Videos Created</CardDescription>
          <CardTitle className="@[250px]/card:text-4xl text-3xl font-bold tabular-nums bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            127
          </CardTitle>
          <div className="absolute right-4 top-16">
            <Badge className="flex gap-1 rounded-lg text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-sm">
              <TrendingUpIcon className="size-3" />
              +18.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10">
          <div className="line-clamp-1 flex gap-2 font-semibold text-blue-900 dark:text-blue-100">
            Up this month <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            {127 - 15} videos this month
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card border-2 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/20 dark:via-gray-900 dark:to-pink-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        <CardHeader className="relative">
          <div className="absolute right-4 top-4 p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <CardDescription className="text-purple-700 dark:text-purple-300 font-medium">Total Views</CardDescription>
          <CardTitle className="@[250px]/card:text-4xl text-3xl font-bold tabular-nums bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            1.2M
          </CardTitle>
          <div className="absolute right-4 top-16">
            <Badge className="flex gap-1 rounded-lg text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm">
              <TrendingUpIcon className="size-3" />
              +32.1%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10">
          <div className="line-clamp-1 flex gap-2 font-semibold text-purple-900 dark:text-purple-100">
            Growing fast <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-purple-700 dark:text-purple-300">
            Across all platforms
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card border-2 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/20 dark:via-gray-900 dark:to-orange-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardHeader className="relative">
          <div className="absolute right-4 top-4 p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <CardDescription className="text-amber-700 dark:text-amber-300 font-medium">Credits Remaining</CardDescription>
          <CardTitle className="@[250px]/card:text-4xl text-3xl font-bold tabular-nums bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            342
          </CardTitle>
          <div className="absolute right-4 top-16">
            <Badge className="flex gap-1 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10">
          <div className="line-clamp-1 flex gap-2 font-semibold text-amber-900 dark:text-amber-100">
            Good balance <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-amber-700 dark:text-amber-300">Resets monthly</div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card border-2 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/20 dark:via-gray-900 dark:to-teal-950/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardHeader className="relative">
          <div className="absolute right-4 top-4 p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <CardDescription className="text-emerald-700 dark:text-emerald-300 font-medium">Avg. Engagement</CardDescription>
          <CardTitle className="@[250px]/card:text-4xl text-3xl font-bold tabular-nums bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            8.4%
          </CardTitle>
          <div className="absolute right-4 top-16">
            <Badge className="flex gap-1 rounded-lg text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm">
              <TrendingUpIcon className="size-3" />
              +2.1%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10">
          <div className="line-clamp-1 flex gap-2 font-semibold text-emerald-900 dark:text-emerald-100">
            Above average <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-emerald-700 dark:text-emerald-300">Industry avg: 6.2%</div>
        </CardFooter>
      </Card>
    </div>
  )
}
